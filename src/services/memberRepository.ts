import { Member, isValidMemberName, createMemberEntity } from '../domain/member';

export interface MemberRepository {
  readonly isOnline?: boolean;
  getMembers(householdCode: string): Promise<Member[]>;
  addMember(member: Omit<Member, 'id' | 'createdAt'>): Promise<Member>;
  updateMember(
    id: string,
    updates: Partial<Pick<Member, 'name' | 'avatarIcon' | 'avatarColor'>>
  ): Promise<Member>;
  deleteMember(id: string, householdCode: string): Promise<void>;
  subscribe?(householdCode: string, onUpdate: () => void): () => void;
}

export class InMemoryMemberRepository implements MemberRepository {
  readonly isOnline = false;
  private members: Member[] = [];
  private listeners: Map<string, Set<() => void>> = new Map();

  constructor(initialMembers: Member[] = []) {
    this.members = [...initialMembers];
  }

  async getMembers(householdCode: string): Promise<Member[]> {
    return this.members.filter((m) => m.householdCode === householdCode);
  }

  notifySubscribers(householdCode: string): void {
    this.listeners.get(householdCode)?.forEach((cb) => {
      try {
        cb();
      } catch {
        // Ignored
      }
    });
  }

  async addMember(member: Omit<Member, 'id' | 'createdAt'>): Promise<Member> {
    if (!isValidMemberName(member.name)) {
      throw new Error('Tên thành viên không hợp lệ');
    }

    const trimmed = member.name.trim();
    const existing = this.members.find(
      (m) =>
        m.householdCode === member.householdCode &&
        m.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      throw new Error('Tên thành viên đã tồn tại');
    }

    const newMember = createMemberEntity(member.householdCode, {
      name: trimmed,
      avatarIcon: member.avatarIcon,
      avatarColor: member.avatarColor,
    });
    this.members.push(newMember);
    this.notifySubscribers(member.householdCode);
    return newMember;
  }

  async updateMember(
    id: string,
    updates: Partial<Pick<Member, 'name' | 'avatarIcon' | 'avatarColor'>>
  ): Promise<Member> {
    const index = this.members.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('Thành viên không tồn tại');
    }

    const current = this.members[index];
    if (updates.name !== undefined) {
      if (!isValidMemberName(updates.name)) {
        throw new Error('Tên thành viên không hợp lệ');
      }
      const trimmed = updates.name.trim();
      const duplicate = this.members.find(
        (m) =>
          m.householdCode === current.householdCode &&
          m.id !== id &&
          m.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) {
        throw new Error('Tên thành viên đã tồn tại');
      }
      current.name = trimmed;
    }

    if (updates.avatarIcon !== undefined) {
      current.avatarIcon = updates.avatarIcon;
    }
    if (updates.avatarColor !== undefined) {
      current.avatarColor = updates.avatarColor;
    }

    this.notifySubscribers(current.householdCode);
    return current;
  }

  async deleteMember(id: string, householdCode: string): Promise<void> {
    this.members = this.members.filter(
      (m) => !(m.householdCode === householdCode && m.id === id)
    );
    this.notifySubscribers(householdCode);
  }

  subscribe(householdCode: string, onUpdate: () => void): () => void {
    if (!this.listeners.has(householdCode)) {
      this.listeners.set(householdCode, new Set());
    }
    this.listeners.get(householdCode)!.add(onUpdate);
    return () => {
      this.listeners.get(householdCode)?.delete(onUpdate);
    };
  }
}

export class LocalStorageMemberRepository implements MemberRepository {
  readonly isOnline = false;

  private getStorageKey(householdCode: string): string {
    return `cooking_plan_members_${householdCode}`;
  }

  private readMembers(householdCode: string): Member[] {
    try {
      const data = localStorage.getItem(this.getStorageKey(householdCode));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private writeMembers(householdCode: string, members: Member[]): void {
    try {
      localStorage.setItem(this.getStorageKey(householdCode), JSON.stringify(members));
    } catch {
      // Ignored
    }
  }

  private findHouseholdKeyForMember(id: string): { householdCode: string; members: Member[] } | null {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cooking_plan_members_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const members: Member[] = JSON.parse(raw);
            const found = members.find((m) => m.id === id);
            if (found) {
              const householdCode = key.replace('cooking_plan_members_', '');
              return { householdCode, members };
            }
          }
        }
      }
    } catch {
      // Ignored
    }
    return null;
  }

  async getMembers(householdCode: string): Promise<Member[]> {
    return this.readMembers(householdCode);
  }

  async addMember(member: Omit<Member, 'id' | 'createdAt'>): Promise<Member> {
    if (!isValidMemberName(member.name)) {
      throw new Error('Tên thành viên không hợp lệ');
    }

    const members = this.readMembers(member.householdCode);
    const trimmed = member.name.trim();
    const existing = members.find(
      (m) => m.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      throw new Error('Tên thành viên đã tồn tại');
    }

    const newMember = createMemberEntity(member.householdCode, {
      name: trimmed,
      avatarIcon: member.avatarIcon,
      avatarColor: member.avatarColor,
    });
    members.push(newMember);
    this.writeMembers(member.householdCode, members);
    return newMember;
  }

  async updateMember(
    id: string,
    updates: Partial<Pick<Member, 'name' | 'avatarIcon' | 'avatarColor'>>
  ): Promise<Member> {
    const found = this.findHouseholdKeyForMember(id);
    if (!found) {
      throw new Error('Thành viên không tồn tại');
    }

    const { householdCode, members } = found;
    const index = members.findIndex((m) => m.id === id);
    const current = members[index];

    if (updates.name !== undefined) {
      if (!isValidMemberName(updates.name)) {
        throw new Error('Tên thành viên không hợp lệ');
      }
      const trimmed = updates.name.trim();
      const duplicate = members.find(
        (m) => m.id !== id && m.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) {
        throw new Error('Tên thành viên đã tồn tại');
      }
      current.name = trimmed;
    }

    if (updates.avatarIcon !== undefined) {
      current.avatarIcon = updates.avatarIcon;
    }
    if (updates.avatarColor !== undefined) {
      current.avatarColor = updates.avatarColor;
    }

    members[index] = current;
    this.writeMembers(householdCode, members);
    return current;
  }

  async deleteMember(id: string, householdCode: string): Promise<void> {
    const members = this.readMembers(householdCode);
    const filtered = members.filter((m) => m.id !== id);
    this.writeMembers(householdCode, filtered);
  }

  subscribe?(_householdCode: string, _onUpdate: () => void): () => void {
    return () => {};
  }
}

export const defaultMemberRepository = new LocalStorageMemberRepository();
