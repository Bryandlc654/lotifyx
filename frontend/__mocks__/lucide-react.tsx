import React from "react";

const mockIcon = (name: string) => {
  const Icon = (props: any) => React.createElement("svg", { "data-testid": `icon-${name}`, ...props });
  Icon.displayName = name;
  return Icon;
};

export const Menu = mockIcon("Menu");
export const X = mockIcon("X");
export const Search = mockIcon("Search");
export const Grid3X3 = mockIcon("Grid3X3");
export const List = mockIcon("List");
export const ChevronDown = mockIcon("ChevronDown");
export const ChevronRight = mockIcon("ChevronRight");
export const Tag = mockIcon("Tag");
export const Loader2 = mockIcon("Loader2");
export const Eye = mockIcon("Eye");
export const Check = mockIcon("Check");
export const ArrowUpDown = mockIcon("ArrowUpDown");
export const Calendar = mockIcon("Calendar");
export const XCircle = mockIcon("XCircle");
export const Trash2 = mockIcon("Trash2");
export const Store = mockIcon("Store");
export const Mail = mockIcon("Mail");
export const Phone = mockIcon("Phone");
export const User = mockIcon("User");
export const AlertTriangle = mockIcon("AlertTriangle");
