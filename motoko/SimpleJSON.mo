// A simplified JSON parser for BitPesa
// Focused on parsing the specific API response from BTC-USD price API

import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Float "mo:base/Float";
import Option "mo:base/Option";

module {
  // Basic JSON path-based value extraction
  
  // Extract a string value from a JSON path like "data.amount"
  public func extractString(json : Text, path : Text) : ?Text {
    let parts = Text.split(path, #char('.'));
    var remainingJson = json;
    
    label pathLoop for (part in parts) {
      let objectKey = "\"" # part # "\"";
      let keyIndex = Text.indexOf(remainingJson, #text(objectKey));
      
      switch (keyIndex) {
        case (null) { 
          return null;
        };
        case (?index) {
          // Move past the key and colon
          let valueStartIndex = index + objectKey.size() + 1;
          
          // Find where this value starts (after any whitespace)
          var i = valueStartIndex;
          while (i < remainingJson.size() and (
            remainingJson.chars().next() == ' ' or
            remainingJson.chars().next() == '\t' or
            remainingJson.chars().next() == '\n' or
            remainingJson.chars().next() == '\r'
          )) {
            i += 1;
          };
          
          // If it's a quoted string
          if ((i < remainingJson.size()) and (Text.charAt(remainingJson, i) == '"')) {
            i += 1; // Skip the opening quote
            let start = i;
            
            // Find the closing quote
            while (i < remainingJson.size() and Text.charAt(remainingJson, i) != '"') {
              i += 1;
            };
            
            if (i < remainingJson.size()) {
              let value = Text.substring(remainingJson, start, i - start);
              
              // If this is the last part in the path, return the value
              if (Option.isNull(parts.next())) {
                return ?value;
              } else {
                // Otherwise, find the object containing the next path
                let objectStartIndex = Text.indexOf(remainingJson, #text("{"));
                let objectEndIndex = Text.indexOf(remainingJson, #text("}"));
                
                switch (objectStartIndex, objectEndIndex) {
                  case (?startIdx, ?endIdx) {
                    if (startIdx < i and endIdx > i) {
                      remainingJson := Text.substring(remainingJson, startIdx, endIdx - startIdx + 1);
                    } else {
                      return null;
                    };
                  };
                  case _ { return null; };
                };
              };
            } else {
              return null;
            };
          } else {
            // Non-string values (could be nested object or other type)
            return null;
          };
        };
      };
    };
    
    null
  };
  
  // Parse a string containing a number value (like "65000.12") to a Nat
  public func parseAmountStringToNat(amountStr : Text, decimalPlaces : Nat) : ?Nat {
    // Remove decimal point
    let withoutDecimal = Text.replace(amountStr, #text("."), #text(""));
    
    switch (Nat.fromText(withoutDecimal)) {
      case (?n) { ?n };
      case (null) { null };
    }
  };
  
  // Extract a price from a specific Coinbase API response format
  public func extractCoinbasePrice(responseBody : Text) : ?Text {
    let prefix = "\"amount\":\"";
    let suffix = "\"}}";
    
    switch (Text.indexOf(responseBody, #text(prefix))) {
      case (?startIdx) {
        let priceStart = startIdx + prefix.size();
        
        switch (Text.indexOf(responseBody, #text(suffix))) {
          case (?endIdx) {
            if (endIdx > priceStart) {
              let price = Text.substring(responseBody, priceStart, endIdx - priceStart);
              ?price
            } else {
              null
            };
          };
          case (null) { null };
        };
      };
      case (null) { null };
    }
  };
}
