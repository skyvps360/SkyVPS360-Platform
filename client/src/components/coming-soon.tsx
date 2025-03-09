import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// This file has been disabled
// The ComingSoon component has been removed

export function ComingSoon() {
  return null;
}

export function withComingSoon(Component: React.ComponentType) {
  return function ComingSoonWrapper(props: any) {
    return <Component {...props} />;
  };
}