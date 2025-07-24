/**
 * Management Canister Interface Module
 * 
 * This module provides the interface to the Internet Computer Management Canister,
 * which allows for HTTP outcalls from canisters.
 * 
 * @version 1.0.0
 */
import Blob "mo:base/Blob";

module {
    public type HttpHeader = {
        name : Text;
        value : Text;
    };

    public type HttpMethod = {
        #GET;
        #POST;
        #PUT;
        #DELETE;
        #HEAD;
    };

    public type TransformContext = {
        function : shared query (response : HttpResponse) -> async HttpResponse;
        context : Blob;
    };

    public type HttpRequest = {
        url : Text;
        max_response_bytes : ?Nat64;
        headers : [HttpHeader];
        method : HttpMethod;
        body : ?Blob;
        transform : ?TransformContext;
    };

    public type HttpResponse = {
        status : Nat;
        headers : [HttpHeader];
        body : Blob;
    };

    public type CanisterId = Principal;

    // Define the IC system module for access to the actual http_request implementation
    private type IC = actor {
        http_request : (HttpRequest, Nat64) -> async { #Ok : HttpResponse; #Err : (Text, Text) };
    };
    
    private let IC = actor "aaaaa-aa" : IC;
    
    /**
     * Make HTTP requests from canisters.
     * 
     * This is the actual function provided by the Internet Computer.
     * The cycles parameter is the amount of cycles sent to pay for the HTTP request.
     */
    public func http_request(request : HttpRequest, cycles : Nat64) : async { #Ok : HttpResponse; #Err : (Text, Text) } {
        await IC.http_request(request, cycles);
    };
}
