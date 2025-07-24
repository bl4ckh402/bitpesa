// A simple JSON parser for Motoko
// Based on JSON parser patterns commonly used in Motoko projects

import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Char "mo:base/Char";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Nat "mo:base/Nat";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Bool "mo:base/Bool";

module {
  public type JSON = {
    #Object : [(Text, JSON)];
    #Array : [JSON];
    #String : Text;
    #Number : Float;
    #Boolean : Bool;
    #Null;
  };

  // Basic error handling
  public type ParseError = {
    #SyntaxError : Text;
    #UnexpectedEOF;
    #UnexpectedToken : Text;
  };

  public type Result<T> = {
    #ok : T;
    #err : ParseError;
  };

  private type ParserState = {
    var text : Text;
    var pos : Nat;
  };

  private func isWhitespace(c : Char) : Bool {
    c == ' ' or c == '\t' or c == '\n' or c == '\r'
  };

  private func skipWhitespace(state : ParserState) {
    while (state.pos < Text.size(state.text) and isWhitespace(Text.charAt(state.text, state.pos))) {
      state.pos += 1;
    };
  };

  private func parseString(state : ParserState) : Result<Text> {
    if (state.pos >= Text.size(state.text)) {
      return #err(#SyntaxError("Expected string starting with quotes"));
    };
    
    if (Text.charAt(state.text, state.pos) != '"') {
      return #err(#SyntaxError("Expected string starting with quotes"));
    };
    
    state.pos += 1; // Skip opening quote
    let start = state.pos;
    var escaped = false;
    
    while (state.pos < Text.size(state.text)) {
      let c = Text.charAt(state.text, state.pos);
      
      if (c == '\\') {
        escaped := not escaped;
      } else if (c == '"' and not escaped) {
        // End of string found
        let result = Text.substring(state.text, start, state.pos - start);
        state.pos += 1; // Skip closing quote
        return #ok(result);
      } else {
        escaped := false;
      };
      
      state.pos += 1;
    };
    
    #err(#UnexpectedEOF)
  };

  private func parseNumber(state : ParserState) : Result<Float> {
    let start = state.pos;
    var foundDecimal = false;
    
    while (state.pos < Text.size(state.text)) {
      let c = Text.charAt(state.text, state.pos);
      
      if (c == '.') {
        if (foundDecimal) {
          return #err(#SyntaxError("Multiple decimal points in number"));
        };
        foundDecimal := true;
      } else if (not (Char.isDigit(c) or c == '-' or c == '+' or c == 'e' or c == 'E')) {
        // End of number
        break;
      };
      
      state.pos += 1;
    };
    
    if (start == state.pos) {
      return #err(#SyntaxError("Empty number"));
    };
    
    let numText = Text.substring(state.text, start, state.pos - start);
    
    switch (Float.fromText(numText)) {
      case (null) { #err(#SyntaxError("Invalid number format")) };
      case (?val) { #ok(val) };
    }
  };

  private func parseValue(state : ParserState) : Result<JSON> {
    skipWhitespace(state);
    
    if (state.pos >= Text.size(state.text)) {
      return #err(#UnexpectedEOF);
    };
    
    let c = Text.charAt(state.text, state.pos);
    
    if (c == '"') {
      switch (parseString(state)) {
        case (#ok(str)) { return #ok(#String(str)) };
        case (#err(e)) { return #err(e) };
      };
    } else if (c == '{') {
      return parseObject(state);
    } else if (c == '[') {
      return parseArray(state);
    } else if (c == 't') {
      if (state.pos + 3 < Text.size(state.text) and 
          Text.substring(state.text, state.pos, 4) == "true") {
        state.pos += 4;
        return #ok(#Boolean(true));
      } else {
        return #err(#SyntaxError("Expected 'true'"));
      };
    } else if (c == 'f') {
      if (state.pos + 4 < Text.size(state.text) and 
          Text.substring(state.text, state.pos, 5) == "false") {
        state.pos += 5;
        return #ok(#Boolean(false));
      } else {
        return #err(#SyntaxError("Expected 'false'"));
      };
    } else if (c == 'n') {
      if (state.pos + 3 < Text.size(state.text) and 
          Text.substring(state.text, state.pos, 4) == "null") {
        state.pos += 4;
        return #ok(#Null);
      } else {
        return #err(#SyntaxError("Expected 'null'"));
      };
    } else if (c == '0' or c == '1' or c == '2' or c == '3' or c == '4' or 
               c == '5' or c == '6' or c == '7' or c == '8' or c == '9' or c == '-') {
      switch (parseNumber(state)) {
        case (#ok(num)) { return #ok(#Number(num)) };
        case (#err(e)) { return #err(e) };
      };
    } else {
      return #err(#UnexpectedToken("Unexpected character: " # Char.toText(c)));
    };
  };

  private func parseObject(state : ParserState) : Result<JSON> {
    state.pos += 1; // Skip '{'
    skipWhitespace(state);
    
    let fields = Buffer.Buffer<(Text, JSON)>(8);
    var first = true;
    
    while (state.pos < Text.size(state.text) and Text.charAt(state.text, state.pos) != '}') {
      if (not first) {
        // Expect a comma
        if (Text.charAt(state.text, state.pos) != ',') {
          return #err(#SyntaxError("Expected ',' in object"));
        };
        state.pos += 1;
        skipWhitespace(state);
      } else {
        first := false;
      };
      
      // Parse key (must be a string)
      switch (parseString(state)) {
        case (#err(e)) { return #err(e) };
        case (#ok(key)) {
          skipWhitespace(state);
          
          // Expect a colon
          if (state.pos >= Text.size(state.text) or Text.charAt(state.text, state.pos) != ':') {
            return #err(#SyntaxError("Expected ':' after object key"));
          };
          state.pos += 1;
          skipWhitespace(state);
          
          // Parse value
          switch (parseValue(state)) {
            case (#err(e)) { return #err(e) };
            case (#ok(val)) {
              fields.add((key, val));
              skipWhitespace(state);
            };
          };
        };
      };
    };
    
    if (state.pos >= Text.size(state.text)) {
      return #err(#UnexpectedEOF);
    };
    
    state.pos += 1; // Skip '}'
    #ok(#Object(Buffer.toArray(fields)))
  };

  private func parseArray(state : ParserState) : Result<JSON> {
    state.pos += 1; // Skip '['
    skipWhitespace(state);
    
    let items = Buffer.Buffer<JSON>(8);
    var first = true;
    
    while (state.pos < Text.size(state.text) and Text.charAt(state.text, state.pos) != ']') {
      if (not first) {
        // Expect a comma
        if (Text.charAt(state.text, state.pos) != ',') {
          return #err(#SyntaxError("Expected ',' in array"));
        };
        state.pos += 1;
        skipWhitespace(state);
      } else {
        first := false;
      };
      
      // Parse array element
      switch (parseValue(state)) {
        case (#err(e)) { return #err(e) };
        case (#ok(val)) {
          items.add(val);
          skipWhitespace(state);
        };
      };
    };
    
    if (state.pos >= Text.size(state.text)) {
      return #err(#UnexpectedEOF);
    };
    
    state.pos += 1; // Skip ']'
    #ok(#Array(Buffer.toArray(items)))
  };

  public func parse(text : Text) : Result<JSON> {
    let state : ParserState = {
      var text = text;
      var pos = 0;
    };
    
    let result = parseValue(state);
    skipWhitespace(state);
    
    // Check if we've consumed all input
    if (state.pos < Text.size(state.text)) {
      #err(#SyntaxError("Unexpected trailing characters"))
    } else {
      result
    }
  };

  // Helper functions to access JSON values
  public func getString(json : JSON, key : Text) : ?Text {
    switch (json) {
      case (#Object(fields)) {
        for ((k, v) in fields.vals()) {
          if (k == key) {
            switch (v) {
              case (#String(val)) { return ?val };
              case (_) { return null };
            };
          };
        };
        null
      };
      case (_) { null };
    }
  };

  public func getNumber(json : JSON, key : Text) : ?Float {
    switch (json) {
      case (#Object(fields)) {
        for ((k, v) in fields.vals()) {
          if (k == key) {
            switch (v) {
              case (#Number(val)) { return ?val };
              case (_) { return null };
            };
          };
        };
        null
      };
      case (_) { null };
    }
  };

  public func getBool(json : JSON, key : Text) : ?Bool {
    switch (json) {
      case (#Object(fields)) {
        for ((k, v) in fields.vals()) {
          if (k == key) {
            switch (v) {
              case (#Boolean(val)) { return ?val };
              case (_) { return null };
            };
          };
        };
        null
      };
      case (_) { null };
    }
  };

  public func getObject(json : JSON, key : Text) : ?[(Text, JSON)] {
    switch (json) {
      case (#Object(fields)) {
        for ((k, v) in fields.vals()) {
          if (k == key) {
            switch (v) {
              case (#Object(obj)) { return ?obj };
              case (_) { return null };
            };
          };
        };
        null
      };
      case (_) { null };
    }
  };
  
  // Access nested properties
  public func getNestedString(json : JSON, path : [Text]) : ?Text {
    var current = json;
    let pathLen = path.size();
    
    if (pathLen == 0) {
      return null;
    };
    
    for (i in Iter.range(0, pathLen - 2)) {
      switch (current) {
        case (#Object(fields)) {
          var found = false;
          for ((k, v) in fields.vals()) {
            if (k == path[i]) {
              current := v;
              found := true;
              break;
            };
          };
          if (not found) {
            return null;
          };
        };
        case (_) {
          return null;
        };
      };
    };
    
    return getString(current, path[pathLen - 1]);
  };
}
