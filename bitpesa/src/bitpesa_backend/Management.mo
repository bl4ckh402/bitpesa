/**
 * Management Canister Interface Module
 *
 * This module provides the interface to the Internet Computer Management Canister,
 * which allows for HTTP outcalls from canisters.
 *
 * @version 3.0.0 - Updated for correct IC management canister specification
 */
import Blob "mo:base/Blob";
import Nat64 "mo:base/Nat64";

module {
  public type HttpHeader = {
    name : Text;
    value : Text;
  };

  public type HttpMethod = {
    #get;
    #post;
    #head;
  };

  public type TransformArgs = {
    response : HttpResponse;
    context : Blob;
  };

  public type CanisterHttpRequestArgs = {
    url : Text;
    max_response_bytes : ?Nat64;
    headers : [HttpHeader];
    body : ?[Nat8];
    method : HttpMethod;
    transform : ?{
      function : shared query (TransformArgs) -> async HttpResponse;
      context : Blob;
    };
  };

  public type HttpResponse = {
    status : Nat;
    headers : [HttpHeader];
    body : [Nat8];
  };

  public type HttpRequest = CanisterHttpRequestArgs;

  // Correct management canister interface as per IC specification
  private type ManagementCanister = actor {
    http_request : (CanisterHttpRequestArgs) -> async HttpResponse;
  };

  private let IC : ManagementCanister = actor "aaaaa-aa";

  /**
   * Make HTTP requests from canisters.
   * 
   * This function calls the Internet Computer's management canister to perform HTTP outcalls.
   * Cycles must be explicitly attached to the call.
   */
  public func http_request(request : HttpRequest, cycles : Nat64) : async {
    #Ok : HttpResponse;
    #Err : (Text, Text);
  } {
    try {
      // Use modern syntax to attach cycles
      let response = await (with cycles = Nat64.toNat(cycles)) IC.http_request(request);
      #Ok(response);
    } catch (_error) {
      #Err("http_request_failed", "HTTP request failed");
    };
  };
}
