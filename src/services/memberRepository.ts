import {
  Member,
  MemberInput,
  isValidMemberName,
  createMemberEntity,
  isDuplicateMemberName,
} from '../domain/member';

export interface MemberRepository {
  readonly isOnline?: boolean;
  getMembers(householdCode: string): Promise<Member[]>;
  addMember(member: Omit<Member, 'id' | 'createdAt'>): Promise<Member>;
  addMember(householdCode: string, member: MemberInput): Promise<Member>;
  updateMember(
    id: string,
    householdCode: string,
    updates: Partial<MemberInput>
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

  async addMember(
    householdCodeOrMember: string | Omit<Member, 'id' | 'createdAt'>,
    maybeMember?: MemberInput
  ): Promise<Member> {
    let householdCode: string;
    let input: MemberInput;

    if (typeof householdCodeOrMember === 'string') {
      householdCode = householdCodeOrMember;
      input = maybeMember!;
    } else {
      householdCode = householdCodeOrMember.householdCode;
      input = {
        name: householdCodeOrMember.name,
        avatarIcon: householdCodeOrMember.avatarIcon,
        avatarColor: householdCodeOrMember.avatarColor,
      };
    }

    if (!isValidMemberName(input.name)) {
      throw new Error('Tên thành viên không hợp lệ');
    }

    const trimmed = input.name.trim();
    const existing = this.members.filter((m) => m.householdCode === householdCode);
    if (isDuplicateMemberName(existing, trimmed)) {
      throw new Error('Tên thành viên đã tồn tại');
    }

    const newMember = createMemberEntity(householdCode, {
      name: trimmed,
      avatarIcon: input.avatarIcon,
      avatarColor: input.avatarColor,
    });
    this.members.push(newMember);
    this.notifySubscribers(householdCode);
    return newMember;
  }

  async updateMember(
    id: string,
    householdCodeOrUpdates: string | Partial<MemberInput>,
    maybeUpdates?: Partial<MemberInput>
  ): Promise<Member> {
    const isHouseholdString = typeof householdCodeOrUpdates === 'string';
    const householdCode = isHouseholdString ? (householdCodeOrUpdates as string) : undefined;
    const updates = isHouseholdString ? maybeUpdates! : (householdCodeOrUpdates as Partial<MemberInput>);

    const index = this.members.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('Thành viên không tồn tại');
    }

    const current = this.members[index];
    const targetHousehold = householdCode || current.householdCode;
    const householdMembers = this.members.filter((m) => m.householdCode === targetHousehold);

    if (updates.name !== undefined) {
      if (!isValidMemberName(updates.name)) {
        throw new Error('Tên thành viên không hợp lệ');
      }
      const trimmed = updates.name.trim();
      if (isDuplicateMemberName(householdMembers, trimmed, id)) {
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

  async getMembers(householdCode: string): Promise<Member[]> {
    return this.readMembers(householdCode);
  }

  async addMember(
    householdCodeOrMember: string | Omit<Member, 'id' | 'createdAt'>,
    maybeMember?: MemberInput
  ): Promise<Member> {
    let householdCode: string;
    let input: MemberInput;

    if (typeof householdCodeOrMember === 'string') {
      householdCode = householdCodeOrMember;
      input = maybeMember!;
    } else {
      householdCode = householdCodeOrMember.householdCode;
      input = {
        name: householdCodeOrMember.name,
        avatarIcon: householdCodeOrMember.avatarIcon,
        avatarColor: householdCodeOrMember.avatarColor,
      };
    }

    if (!isValidMemberName(input.name)) {
      throw new Error('Tên thành viên không hợp lệ');
    }

    const trimmed = input.name.trim();
    const members = this.readMembers(householdCode);
    if (isDuplicateMemberName(members, trimmed)) {
      throw new Error('Tên thành viên đã tồn tại');
    }

    const newMember = createMemberEntity(householdCode, {
      name: trimmed,
      avatarIcon: input.avatarIcon,
      avatarColor: input.avatarColor,
    });
    members.push(newMember);
    this.writeMembers(householdCode, members);
    return newMember;
  }

  async updateMember(
    id: string,
    householdCode: string,
    updates: Partial<MemberInput>
  ): Promise<Member> {
    const members = this.readMembers(householdCode);
    const index = members.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('Thành viên không tồn tại');
    }

    const current = members[index];

    if (updates.name !== undefined) {
      if (!isValidMemberName(updates.name)) {
        throw new Error('Tên thành viên không hợp lệ');
      }
      const trimmed = updates.name.trim();
      if (isDuplicateMemberName(members, trimmed, id)) {
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
