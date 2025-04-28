export interface Position {
  id: string;
  name: string;
  description: string;
  exists: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  positionId: string;
  bio: string;
  imageUrl?: string;
  metadata?: string;
  exists: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  organizationName: string;
  status: 'draft' | 'active' | 'ended';
  isActive?: boolean;
  positions: Position[];
  candidates: Candidate[];
}