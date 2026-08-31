export type UserRole = 'citizen' | 'officer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  taluka?: string;
  department?: string;
  designation?: string;
}

export type ComplaintStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved';

export type ComplaintPriority = 'low' | 'medium' | 'high';

export type ComplaintCategory =
  | 'Deep Pothole'
  | 'Waterlogged Crater'
  | 'Road Edge Erosion'
  | 'Trench / Utility Cut'
  | 'Asphalt Surface Crack'
  | 'Culvert / Bridge Depression'
  | 'Manhole / Drain Hazard'
  | 'Other';

export type GoaTaluka =
  | 'Panaji (Tiswadi)'
  | 'Margao (Salcete)'
  | 'Mapusa (Bardez)'
  | 'Vasco da Gama (Mormugao)'
  | 'Ponda (Ponda)'
  | 'Bicholim'
  | 'Curchorem (Quepem)'
  | 'Pernem';

export type RoadType =
  | 'National Highway'
  | 'State Highway'
  | 'Major District Road'
  | 'Municipal / City Road'
  | 'Village / Panchayat Road';

export interface ComplaintNote {
  id: string;
  author: string;
  authorRole: UserRole;
  timestamp: string;
  text: string;
  photoUrl?: string;
}

export interface ComplaintLocation {
  taluka: GoaTaluka;
  landmark: string;
  roadName: string;
  roadType: RoadType;
  latitude: number;
  longitude: number;
}

export interface ComplaintFeedback {
  id: string;
  complaintId: string;
  citizenId: string;
  citizenName: string;
  rating: number; // 1 to 5
  comment?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  predictedCategory?: ComplaintCategory;
  imageUrl: string;
  location: ComplaintLocation;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  priorityReason?: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  citizenEmail: string;
  assignedTo?: {
    division: string;
    officerName: string;
    assignedDate: string;
    contractorTeam?: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionPhotoUrl?: string;
  resolutionNotes?: string;
  notes: ComplaintNote[];
  feedbacks?: ComplaintFeedback[];
  estimatedDays?: number;
}

export type PageView =
  | 'login'
  | 'citizen_dashboard'
  | 'submit_complaint'
  | 'complaint_details'
  | 'officer_dashboard'
  | 'complaint_map'
  | 'analytics';

export type Language = 'en' | 'hi';

export type NotificationType =
  | 'complaint_status'
  | 'complaint_assigned'
  | 'complaint_resolved'
  | 'weather_alert'
  | 'monsoon_advisory'
  | 'high_priority_alert'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string; // specific user ID or 'all' | 'citizens' | 'officers'
  title: string;
  message: string;
  type: NotificationType;
  complaintId?: string;
  isRead: boolean;
  createdAt: string;
  priority?: 'normal' | 'urgent' | 'warning';
  actionPage?: PageView;
  metadata?: Record<string, any>;
}
