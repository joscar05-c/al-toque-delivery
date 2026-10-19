declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideIconProps extends React.SVGAttributes<SVGSVGElement> {
    size?: number;
    color?: string;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
  }
  export type LucideIcon = React.ForwardRefExoticComponent<LucideIconProps & React.RefAttributes<SVGSVGElement>>;
  
  export const Users: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const Star: LucideIcon;
  export const Clock: LucideIcon;
  export const Truck: LucideIcon;
  export const ChefHat: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const XCircle: LucideIcon;
  export const Settings: LucideIcon;
  export const Menu: LucideIcon;
  export const LogOut: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const FileText: LucideIcon;
  export const Category: LucideIcon;
  export const Store: LucideIcon;
  export const Edit: LucideIcon;
  export const Edit2: LucideIcon;
  export const Search: LucideIcon;
  export const Plus: LucideIcon;
  export const X: LucideIcon;
  export const Check: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Filter: LucideIcon;
  export const Tag: LucideIcon;
  export const Phone: LucideIcon;
  export const MapPin: LucideIcon;
  export const User: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Eye: LucideIcon;
  export const Sparkles: LucideIcon;
  export const ArrowUpDown: LucideIcon;
  export const Building2: LucideIcon;
  export const Inbox: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ToggleLeft: LucideIcon;
  export const ToggleRight: LucideIcon;
  export const Trash2: LucideIcon;
  export const Image: LucideIcon;
  export const Power: LucideIcon;
  export const Award: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const Utensils: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Shield: LucideIcon;
  export const Mail: LucideIcon;
}