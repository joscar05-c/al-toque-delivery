/**
 * Tipos generados a partir del DDL de Supabase (BD.txt).
 *
 * IMPORTANTE: este archivo refleja el esquema real de la base de datos.
 * Si el esquema cambia, lo ideal es regenerarlo con la CLI oficial:
 *
 *   npx supabase gen types typescript --project-id <TU_PROJECT_ID> > src/types/database.types.ts
 *
 * Notas del esquema:
 * - geography(Point, 4326) de PostGIS se expone como string (hex WKB / GeoJSON).
 * - Las columnas camelCase ("isActive", "deliveryAddress", etc.) se mantienen
 *   exactamente como están en la base de datos.
 * - numeric(10, 2) se representa como number.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string;
          street: string;
          city: string;
          postal_code: string;
          reference: string | null;
          type: Database['public']['Enums']['addresses_type_enum'];
          is_default: boolean;
          location: string | null;
          created_at: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          street: string;
          city: string;
          postal_code: string;
          reference?: string | null;
          type?: Database['public']['Enums']['addresses_type_enum'];
          is_default?: boolean;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          street?: string;
          city?: string;
          postal_code?: string;
          reference?: string | null;
          type?: Database['public']['Enums']['addresses_type_enum'];
          is_default?: boolean;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_16aac8a9f6f9c1dd6bcb75ec023';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      device_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: Database['public']['Enums']['device_tokens_platform_enum'];
          deviceInfo: Json | null;
          isActive: boolean;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform?: Database['public']['Enums']['device_tokens_platform_enum'];
          deviceInfo?: Json | null;
          isActive?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: Database['public']['Enums']['device_tokens_platform_enum'];
          deviceInfo?: Json | null;
          isActive?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_17e1f528b993c6d55def4cf5bea';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      driver_applications: {
        Row: {
          id: string;
          user_id: string;
          dni: string;
          vehicle_type: Database['public']['Enums']['driver_applications_vehicle_type_enum'];
          birth_date: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          license_number: string | null;
          license_expiry: string | null;
          vehicle_plate: string | null;
          vehicle_brand: string | null;
          vehicle_model: string | null;
          vehicle_year: number | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          dni_photo: string | null;
          license_front_photo: string | null;
          license_back_photo: string | null;
          vehicle_photo: string | null;
          status: Database['public']['Enums']['driver_applications_status_enum'];
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dni: string;
          vehicle_type: Database['public']['Enums']['driver_applications_vehicle_type_enum'];
          birth_date: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          license_number?: string | null;
          license_expiry?: string | null;
          vehicle_plate?: string | null;
          vehicle_brand?: string | null;
          vehicle_model?: string | null;
          vehicle_year?: number | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          dni_photo?: string | null;
          license_front_photo?: string | null;
          license_back_photo?: string | null;
          vehicle_photo?: string | null;
          status?: Database['public']['Enums']['driver_applications_status_enum'];
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dni?: string;
          vehicle_type?: Database['public']['Enums']['driver_applications_vehicle_type_enum'];
          birth_date?: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          license_number?: string | null;
          license_expiry?: string | null;
          vehicle_plate?: string | null;
          vehicle_brand?: string | null;
          vehicle_model?: string | null;
          vehicle_year?: number | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          dni_photo?: string | null;
          license_front_photo?: string | null;
          license_back_photo?: string | null;
          vehicle_photo?: string | null;
          status?: Database['public']['Enums']['driver_applications_status_enum'];
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_66cd13f17547a3a4170bd0a852f';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_driver_app_reviewed_by';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      driver_locations: {
        Row: {
          id: string;
          driver_id: string;
          latitude: number;
          longitude: number;
          heading: number | null;
          speed: number | null;
          accuracy: number | null;
          isActive: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          latitude: number;
          longitude: number;
          heading?: number | null;
          speed?: number | null;
          accuracy?: number | null;
          isActive?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          latitude?: number;
          longitude?: number;
          heading?: number | null;
          speed?: number | null;
          accuracy?: number | null;
          isActive?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_096de534e1c6301cf7f2a4bf032';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sortOrder: number;
          isActive: boolean;
          created_at: string;
          updated_at: string;
          restaurant_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sortOrder?: number;
          isActive?: boolean;
          created_at?: string;
          updated_at?: string;
          restaurant_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          sortOrder?: number;
          isActive?: boolean;
          created_at?: string;
          updated_at?: string;
          restaurant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_a1650861201d802c0ad078fff8e';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_item_option_groups: {
        Row: {
          group_id: string;
          menu_item_id: string;
        };
        Insert: {
          group_id: string;
          menu_item_id: string;
        };
        Update: {
          group_id?: string;
          menu_item_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_67bb99c77749602bc9b13cc8103';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'menu_option_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_79dfa533929c9478356e2185397';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_active: boolean;
          restaurant_id: string | null;
          menu_category_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_active?: boolean;
          restaurant_id?: string | null;
          menu_category_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_active?: boolean;
          restaurant_id?: string | null;
          menu_category_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_8d1ee4780bf64ae94cbf3e53705';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_c9de071819628ca98bc8471c24d';
            columns: ['menu_category_id'];
            isOneToOne: false;
            referencedRelation: 'menu_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_option_groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          minSelect: number;
          maxSelect: number;
          isRequired: boolean;
          created_at: string;
          updated_at: string;
          restaurant_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          minSelect?: number;
          maxSelect?: number;
          isRequired?: boolean;
          created_at?: string;
          updated_at?: string;
          restaurant_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          minSelect?: number;
          maxSelect?: number;
          isRequired?: boolean;
          created_at?: string;
          updated_at?: string;
          restaurant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_8ea966448884ee5113fff1bebe3';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_options: {
        Row: {
          id: string;
          name: string;
          extraPrice: number;
          isActive: boolean;
          created_at: string;
          updated_at: string;
          group_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          extraPrice?: number;
          isActive?: boolean;
          created_at?: string;
          updated_at?: string;
          group_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          extraPrice?: number;
          isActive?: boolean;
          created_at?: string;
          updated_at?: string;
          group_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_8f0643eeb59f900bff840cc313f';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'menu_option_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          quantity: number;
          unit_price: number;
          comment: string | null;
          options: Json | null;
          order_id: string | null;
          menu_item_id: string | null;
        };
        Insert: {
          id?: string;
          quantity: number;
          unit_price: number;
          comment?: string | null;
          options?: Json | null;
          order_id?: string | null;
          menu_item_id?: string | null;
        };
        Update: {
          id?: string;
          quantity?: number;
          unit_price?: number;
          comment?: string | null;
          options?: Json | null;
          order_id?: string | null;
          menu_item_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_145532db85752b29c57d2b7b1f1';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_e462517174f561ece2916701c0a';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
        ];
      };
      order_payments: {
        Row: {
          id: string;
          order_id: string;
          payment_method_code: string;
          amount: number;
          delivery_fee: number;
          subtotal: number;
          cash_amount: number | null;
          change_amount: number | null;
          transaction_reference: string | null;
          payment_proof_url: string | null;
          card_last_digits: string | null;
          card_brand: string | null;
          transaction_id: string | null;
          payment_status: string;
          verified_at: string | null;
          verified_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          payment_method_code: string;
          amount: number;
          delivery_fee?: number;
          subtotal: number;
          cash_amount?: number | null;
          change_amount?: number | null;
          transaction_reference?: string | null;
          payment_proof_url?: string | null;
          card_last_digits?: string | null;
          card_brand?: string | null;
          transaction_id?: string | null;
          payment_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          payment_method_code?: string;
          amount?: number;
          delivery_fee?: number;
          subtotal?: number;
          cash_amount?: number | null;
          change_amount?: number | null;
          transaction_reference?: string | null;
          payment_proof_url?: string | null;
          card_last_digits?: string | null;
          card_brand?: string | null;
          transaction_id?: string | null;
          payment_status?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_5d2ebca202f9d9370a001a571ba';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_8c8c850519619fe7fb853992970';
            columns: ['verified_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          status: Database['public']['Enums']['orders_status_enum'];
          total: number;
          notes: string | null;
          deliveryAddress: string | null;
          estimated_prep_time: number | null;
          estimated_ready_time: string | null;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
          client_id: string | null;
          driver_id: string | null;
          restaurant_id: string | null;
        };
        Insert: {
          id?: string;
          status?: Database['public']['Enums']['orders_status_enum'];
          total: number;
          notes?: string | null;
          deliveryAddress?: string | null;
          estimated_prep_time?: number | null;
          estimated_ready_time?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          client_id?: string | null;
          driver_id?: string | null;
          restaurant_id?: string | null;
        };
        Update: {
          id?: string;
          status?: Database['public']['Enums']['orders_status_enum'];
          total?: number;
          notes?: string | null;
          deliveryAddress?: string | null;
          estimated_prep_time?: number | null;
          estimated_ready_time?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          client_id?: string | null;
          driver_id?: string | null;
          restaurant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_222cd7bf166a2d7a6aad9cdebee';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_505ba3689ef2763acd6c4fc93a4';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_85fdda5fcce2f397ef8f117a2c6';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_methods: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          is_active: boolean;
          icon_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          icon_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          icon_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      restaurant_applications: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          business_phone: string;
          business_email: string | null;
          address: string;
          category_id: string;
          city: Database['public']['Enums']['restaurant_applications_city_enum'];
          owner_name: string;
          owner_dni: string;
          additional_comments: string | null;
          status: Database['public']['Enums']['restaurant_applications_status_enum'];
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          restaurant_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          business_phone: string;
          business_email?: string | null;
          address: string;
          category_id: string;
          city: Database['public']['Enums']['restaurant_applications_city_enum'];
          owner_name: string;
          owner_dni: string;
          additional_comments?: string | null;
          status?: Database['public']['Enums']['restaurant_applications_status_enum'];
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          restaurant_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          business_phone?: string;
          business_email?: string | null;
          address?: string;
          category_id?: string;
          city?: Database['public']['Enums']['restaurant_applications_city_enum'];
          owner_name?: string;
          owner_dni?: string;
          additional_comments?: string | null;
          status?: Database['public']['Enums']['restaurant_applications_status_enum'];
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          restaurant_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_23f51747c4478f09050c989b553';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_a493a0abf7ea9bb97dc988b748e';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_f01aedac017ecac14dcb8dcb0cb';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'restaurant_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurant_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          isActive: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          isActive?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          isActive?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      restaurant_delivery_config: {
        Row: {
          id: string;
          restaurant_id: string;
          delivery_fee: number;
          free_delivery_threshold: number | null;
          min_order_amount: number | null;
          max_delivery_distance: number;
          estimated_delivery_time: number;
          is_delivery_enabled: boolean;
          delivery_type: Database['public']['Enums']['restaurant_delivery_config_delivery_type_enum'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          delivery_fee?: number;
          free_delivery_threshold?: number | null;
          min_order_amount?: number | null;
          max_delivery_distance?: number;
          estimated_delivery_time?: number;
          is_delivery_enabled?: boolean;
          delivery_type?: Database['public']['Enums']['restaurant_delivery_config_delivery_type_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          delivery_fee?: number;
          free_delivery_threshold?: number | null;
          min_order_amount?: number | null;
          max_delivery_distance?: number;
          estimated_delivery_time?: number;
          is_delivery_enabled?: boolean;
          delivery_type?: Database['public']['Enums']['restaurant_delivery_config_delivery_type_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_cd67535d4bb755f616638b1f65c';
            columns: ['restaurant_id'];
            isOneToOne: true;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurant_drivers: {
        Row: {
          id: string;
          restaurant_id: string;
          driver_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          driver_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          driver_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_80b6e3142ee2171d8481d059e2c';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_ba218430ec9de15dcddb4648b96';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          address: string;
          phone: string;
          city: Database['public']['Enums']['restaurants_city_enum'] | null;
          image_url: string | null;
          average_prep_time: number;
          is_active: boolean;
          location: string | null;
          created_at: string;
          updated_at: string;
          restaurant_category_id: string | null;
          owner_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          phone: string;
          city?: Database['public']['Enums']['restaurants_city_enum'] | null;
          image_url?: string | null;
          average_prep_time?: number;
          is_active?: boolean;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
          restaurant_category_id?: string | null;
          owner_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          phone?: string;
          city?: Database['public']['Enums']['restaurants_city_enum'] | null;
          image_url?: string | null;
          average_prep_time?: number;
          is_active?: boolean;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
          restaurant_category_id?: string | null;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_802e4db69f9c6b2c239592d878d';
            columns: ['restaurant_category_id'];
            isOneToOne: false;
            referencedRelation: 'restaurant_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'FK_efe4eead3adf44a4649a3353efc';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          q1_app_loading_speed: number;
          q2_product_selection_ease: number;
          q3_menu_navigation_ease: number;
          q4_order_accuracy: number;
          q5_payment_address_accuracy: number;
          q6_order_tracking_visibility: number;
          q7_communication_need: number;
          q8_delivery_timeliness: number;
          q9_app_vs_phone_speed: number;
          q10_overall_satisfaction: number;
          q11_recommendation_likelihood: number;
          comment: string | null;
          created_at: string;
          order_id: string | null;
        };
        Insert: {
          id?: string;
          q1_app_loading_speed?: number;
          q2_product_selection_ease?: number;
          q3_menu_navigation_ease?: number;
          q4_order_accuracy?: number;
          q5_payment_address_accuracy?: number;
          q6_order_tracking_visibility?: number;
          q7_communication_need?: number;
          q8_delivery_timeliness?: number;
          q9_app_vs_phone_speed?: number;
          q10_overall_satisfaction?: number;
          q11_recommendation_likelihood?: number;
          comment?: string | null;
          created_at?: string;
          order_id?: string | null;
        };
        Update: {
          id?: string;
          q1_app_loading_speed?: number;
          q2_product_selection_ease?: number;
          q3_menu_navigation_ease?: number;
          q4_order_accuracy?: number;
          q5_payment_address_accuracy?: number;
          q6_order_tracking_visibility?: number;
          q7_communication_need?: number;
          q8_delivery_timeliness?: number;
          q9_app_vs_phone_speed?: number;
          q10_overall_satisfaction?: number;
          q11_recommendation_likelihood?: number;
          comment?: string | null;
          created_at?: string;
          order_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_e4b0ed40bdd0f318108612c2851';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      roles: {
        Row: {
          id: number;
          name: Database['public']['Enums']['roles_name_enum'];
        };
        Insert: {
          id?: number;
          name?: Database['public']['Enums']['roles_name_enum'];
        };
        Update: {
          id?: number;
          name?: Database['public']['Enums']['roles_name_enum'];
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          name: string;
          phone: string | null;
          phone_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          role_id: number | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          name: string;
          phone?: string | null;
          phone_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          role_id?: number | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string;
          phone?: string | null;
          phone_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          role_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'FK_a2cecd1a3531c0b041e29ba46e1';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      roles_name_enum: 'client' | 'driver' | 'restaurant_owner' | 'admin';
      addresses_type_enum: 'home' | 'work' | 'other';
      device_tokens_platform_enum: 'android' | 'ios' | 'web';
      driver_applications_vehicle_type_enum: 'motorcycle' | 'bicycle' | 'car';
      driver_applications_status_enum: 'draft' | 'pending' | 'approved' | 'rejected';
      restaurant_applications_city_enum: 'bagua' | 'jaen' | 'chachapoyas' | 'other';
      restaurant_applications_status_enum: 'pending' | 'approved' | 'rejected';
      restaurants_city_enum: 'bagua' | 'jaen' | 'chachapoyas' | 'other';
      orders_status_enum:
        | 'pending'
        | 'accepted'
        | 'preparing'
        | 'ready'
        | 'picked_up'
        | 'delivered'
        | 'cancelled';
      restaurant_delivery_config_delivery_type_enum:
        | 'platform'
        | 'restaurant_own'
        | 'pickup_only';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------------------------------------------------------------------------
// Helpers de conveniencia
// ---------------------------------------------------------------------------

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> =
  PublicSchema['Enums'][T];

// ---------------------------------------------------------------------------
// Alias de las entidades principales
// ---------------------------------------------------------------------------

export type Role = Tables<'roles'>;
export type RoleName = Enums<'roles_name_enum'>;

export type User = Tables<'users'>;
export type Address = Tables<'addresses'>;

export type Restaurant = Tables<'restaurants'>;
export type RestaurantCategory = Tables<'restaurant_categories'>;
export type MenuCategory = Tables<'menu_categories'>;
export type MenuItem = Tables<'menu_items'>;

export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type OrderPayment = Tables<'order_payments'>;
export type OrderStatus = Enums<'orders_status_enum'>;

export type DriverLocation = Tables<'driver_locations'>;
export type DriverApplication = Tables<'driver_applications'>;

/** Perfil de public.users con el nombre del rol embebido (join roles). */
export type UserProfile = User & {
  roles: Pick<Role, 'name'> | null;
};
