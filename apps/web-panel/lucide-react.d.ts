declare module 'lucide-react' {
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
  // Add others as needed
  export const Menu: LucideIcon;
  export const LogOut: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const FileText: LucideIcon;
  export const Category: LucideIcon;
}