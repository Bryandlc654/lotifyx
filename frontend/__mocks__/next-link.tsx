import React from "react";

const MockLink = ({ children, href, ...props }: any) =>
  React.createElement("a", { href, ...props }, children);

MockLink.displayName = "Link";
export default MockLink;
