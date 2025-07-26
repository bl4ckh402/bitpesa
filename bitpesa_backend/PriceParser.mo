import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

module {

  public func extractBtcUsdPrice(responseBody : Text) : ?Nat {
    let prefix = "\"amount\":\"";
    let suffix = "\"";

    // Find the prefix
    let prefixMatches = Text.split(responseBody, #text(prefix));
    var remaining = "";

    switch (prefixMatches.next()) {
      case null {return null};
      case (?_) {
        switch (prefixMatches.next()) {
          case null {return null};
          case (?afterPrefix) {
            remaining := afterPrefix
          }
        }
      }
    };

    // Find the suffix
    let suffixMatches = Text.split(remaining, #text(suffix));
    var priceText = "";

    switch (suffixMatches.next()) {
      case null {return null};
      case (?beforeSuffix) {
        priceText := beforeSuffix
      }
    };

    // Remove decimal point
    let priceNoDecimal = Text.replace(priceText, #char('.'), "");

    // Parse to Nat
    switch (Nat.fromText(priceNoDecimal)) {
      case null {
        Debug.print("Failed to parse price text: " # priceNoDecimal);
        return null
      };
      case (?price) {return ?price}
    }
  }
}
