import React from 'react';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  showSign?: boolean;
  showPrefix?: boolean;
  noCents?: boolean;
}

/**
 * CurrencyDisplay component for consistent currency formatting
 * 
 * Accepts an amount in cents and formats it as a currency string
 * 
 * @param amount - The amount in cents to display
 * @param currency - The currency code to display (default: "USD")
 * @param className - Additional CSS classes
 * @param showSign - Whether to show + for positive values
 * @param showPrefix - Whether to show the currency code
 * @param noCents - Whether to hide cents (round to whole numbers)
 */
export function CurrencyDisplay({
  amount,
  currency = "USD",
  className,
  showSign = false,
  showPrefix = true,
  noCents = false
}: CurrencyDisplayProps) {
  // Convert cents to dollars
  const dollars = amount / 100;
  
  // Format the value with the appropriate sign
  const isNegative = dollars < 0;
  const absoluteValue = Math.abs(dollars);
  const formattedValue = noCents 
    ? Math.round(absoluteValue).toString()
    : absoluteValue.toFixed(2);
  
  // Build the display string parts separately to avoid formatting issues
  let currencySuffix = showPrefix ? ` ${currency}` : '';
  
  // Determine text color based on amount
  const textColorClass = isNegative 
    ? "text-red-600" 
    : (dollars >= 5 ? "text-green-600" : "text-muted-foreground");
  
  // For positive values
  if (!isNegative) {
    const prefix = showSign && dollars > 0 ? '+$' : '$';
    return (
      <span 
        className={cn(
          "font-mono tabular-nums", 
          textColorClass,
          className
        )}
      >
        {prefix}{formattedValue}{currencySuffix}
      </span>
    );
  }
  
  // For negative values - IMPORTANT: only ONE negative sign at the beginning
  return (
    <span 
      className={cn(
        "font-mono tabular-nums", 
        textColorClass,
        className
      )}
    >
      -${formattedValue}{currencySuffix}
    </span>
  );
}