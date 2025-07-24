// A minimal parser for Coinbase API responses
// Specifically designed for parsing the BTC-USD price from Coinbase API

import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";

module {
  // Parse the Coinbase price API response and extract the price value
  // Example: {"data":{"base":"BTC","currency":"USD","amount":"65000.12"}}
  public func parsePriceResponse(responseBody : Text) : ?Nat {
    let amountPrefix = "\"amount\":\"";
    let amountSuffix = "\"}}";
    
    // Find the position of the price amount in the response
    switch (Text.indexOf(responseBody, #text(amountPrefix))) {
      case (null) {
        Debug.print("Could not find price prefix in response");
        return null;
      };
      case (?startIdx) {
        let valueStartIndex = startIdx + amountPrefix.size();
        
        switch (Text.indexOf(responseBody, #text(amountSuffix))) {
          case (null) {
            Debug.print("Could not find price suffix in response");
            return null;
          };
          case (?endIdx) {
            if (endIdx <= valueStartIndex) {
              Debug.print("Invalid price format in response");
              return null;
            };
            
            // Extract the price string (e.g., "65000.12")
            let priceStr = Text.substring(responseBody, valueStartIndex, endIdx - valueStartIndex);
            
            // Remove the decimal point for integer math
            let priceWithoutDecimal = Text.replace(priceStr, #text("."), #text(""));
            
            // Convert to Nat
            switch (Nat.fromText(priceWithoutDecimal)) {
              case (?price) { return ?price };
              case (null) {
                Debug.print("Could not parse price from text: " # priceWithoutDecimal);
                return null;
              };
            };
          };
        };
      };
    };
  };
  
  // Helper function to validate the response format before parsing
  public func validateCoinbaseResponse(responseBody : Text) : Bool {
    // Check for the expected structure
    let hasData = Text.contains(responseBody, #text("\"data\":"));
    let hasBase = Text.contains(responseBody, #text("\"base\":\"BTC\""));
    let hasCurrency = Text.contains(responseBody, #text("\"currency\":\"USD\""));
    let hasAmount = Text.contains(responseBody, #text("\"amount\":\""));
    
    return hasData and hasBase and hasCurrency and hasAmount;
  };
}
