export interface Member {
  id: string;
  householdCode: string;
  name: string;
  avatarIcon: string;
  avatarColor: string;
  createdAt: string;
}

export interface AvatarPreset {
  icon: string;
  bg: string;
  border: string;
  label: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { icon: '🍳', bg: 'bg-[#FEF7DC]', border: 'border-[#EFE4B5]', label: 'Chảo ốp la' },
  { icon: '🥗', bg: 'bg-[#DCFCE7]', border: 'border-[#BBF7D0]', label: 'Salad tươi' },
  { icon: '🍜', bg: 'bg-[#E0F2FE]', border: 'border-[#BAE6FD]', label: 'Mì thơm' },
  { icon: '🥑', bg: 'bg-[#ECFCCB]', border: 'border-[#D9F99D]', label: 'Bơ béo' },
  { icon: '🍰', bg: 'bg-[#FCE7F3]', border: 'border-[#FBCFE8]', label: 'Bánh kem' },
  { icon: '🍕', bg: 'bg-[#FFEDD5]', border: 'border-[#FED7AA]', label: 'Pizza nóng' },
  { icon: '🥕', bg: 'bg-[#FEF3C7]', border: 'border-[#FDE68A]', label: 'Cà rốt ngọt' },
  { icon: '🍲', bg: 'bg-[#F3E8FF]', border: 'border-[#E9D5FF]', label: 'Lẩu gia đình' },
];

export function isValidMemberName(name: string): boolean {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 30;
}

export function createMemberEntity(
  householdCode: string,
  input: { name: string; avatarIcon?: string; avatarColor?: string }
): Member {
  const trimmed = input.name.trim();
  const preset = AVATAR_PRESETS.find((p) => p.icon === input.avatarIcon) || AVATAR_PRESETS[0];

  return {
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    householdCode,
    name: trimmed,
    avatarIcon: input.avatarIcon || preset.icon,
    avatarColor: input.avatarColor || preset.bg,
    createdAt: new Date().toISOString(),
  };
}
