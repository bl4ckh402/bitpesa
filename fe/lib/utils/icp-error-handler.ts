/**
 * ICP Error Handler Utilities
 * Handles common ICP errors like delegation issues, certificate verification failures, etc.
 */

export interface ICPError extends Error {
  message: string;
  code?: string | number;
  details?: any;
}

export class ICPErrorHandler {
  /**
   * Check if an error is related to delegation or certificate issues
   * Enhanced based on ICP documentation and GitHub issue patterns
   */
  static isDelegationError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString() || '';
    const errorString = errorMessage.toLowerCase();
    
    return (
      errorString.includes('delegation') ||
      errorString.includes('certificate') ||
      errorString.includes('signature') ||
      errorString.includes('threshold') ||
      errorString.includes('verification failed') ||
      errorString.includes('invalid canister signature') ||
      errorString.includes('expired') ||
      (errorString.includes('time') && errorString.includes('sync')) ||
      errorString.includes('iccanistersignature') ||
      errorString.includes('delegation chain') ||
      errorString.includes('ingress expiry') ||
      errorString.includes('fetch root key') ||
      errorString.includes('unable to fetch root key')
    );
  }

  /**
   * Check if an error is related to time synchronization
   */
  static isTimeError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString() || '';
    const errorString = errorMessage.toLowerCase();
    
    return (
      errorString.includes('time') ||
      errorString.includes('clock') ||
      errorString.includes('expired') ||
      errorString.includes('ingress expiry')
    );
  }

  /**
   * Check if an error suggests the user needs to re-authenticate
   */
  static isAuthenticationError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString() || '';
    const errorString = errorMessage.toLowerCase();
    
    return (
      errorString.includes('anonymous') ||
      errorString.includes('not authenticated') ||
      errorString.includes('unauthorized') ||
      errorString.includes('authentication required') ||
      this.isDelegationError(error)
    );
  }

  /**
   * Check if an error is network-related
   */
  static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString() || '';
    const errorString = errorMessage.toLowerCase();
    
    return (
      errorString.includes('network') ||
      errorString.includes('fetch') ||
      errorString.includes('connection') ||
      errorString.includes('timeout') ||
      errorString.includes('unreachable')
    );
  }

  /**
   * Get a user-friendly error message for ICP errors
   */
  static getUserFriendlyMessage(error: any): string {
    if (!error) return 'An unknown error occurred';

    if (this.isDelegationError(error)) {
      return 'Authentication expired. Please sign in again to continue.';
    }

    if (this.isTimeError(error)) {
      return 'Time synchronization issue detected. Please try again in a moment.';
    }

    if (this.isNetworkError(error)) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }

    if (this.isAuthenticationError(error)) {
      return 'Authentication required. Please sign in to continue.';
    }

    // Return the original error message if it's user-friendly, otherwise a generic message
    const originalMessage = error.message || error.toString();
    if (originalMessage.length < 200 && !originalMessage.includes('0x')) {
      return originalMessage;
    }

    return 'An error occurred while connecting to the Internet Computer. Please try again.';
  }

  /**
   * Get suggested actions for an error
   */
  static getSuggestedActions(error: any): string[] {
    const actions: string[] = [];

    if (this.isDelegationError(error) || this.isAuthenticationError(error)) {
      actions.push('Sign out and sign in again');
      actions.push('Clear browser cache and cookies');
    }

    if (this.isTimeError(error)) {
      actions.push('Wait a moment and try again');
      actions.push('Check your system clock is correct');
    }

    if (this.isNetworkError(error)) {
      actions.push('Check your internet connection');
      actions.push('Try refreshing the page');
    }

    if (actions.length === 0) {
      actions.push('Try refreshing the page');
      actions.push('Contact support if the issue persists');
    }

    return actions;
  }

  /**
   * Log error details for debugging
   */
  static logError(error: any, context?: string): void {
    const prefix = context ? `[${context}]` : '[ICP Error]';
    
    console.group(`${prefix} Error Details`);
    console.error('Error:', error);
    console.log('Is Delegation Error:', this.isDelegationError(error));
    console.log('Is Time Error:', this.isTimeError(error));
    console.log('Is Auth Error:', this.isAuthenticationError(error));
    console.log('Is Network Error:', this.isNetworkError(error));
    console.log('User-friendly message:', this.getUserFriendlyMessage(error));
    console.log('Suggested actions:', this.getSuggestedActions(error));
    
    if (error.stack) {
      console.log('Stack trace:', error.stack);
    }
    
    console.groupEnd();
  }
}

/**
 * Wrapper function to handle ICP calls with automatic error handling
 */
export async function withICPErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string,
  onError?: (error: ICPError) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    ICPErrorHandler.logError(error, context);
    
    if (onError) {
      onError(error as ICPError);
    }
    
    throw error;
  }
}
