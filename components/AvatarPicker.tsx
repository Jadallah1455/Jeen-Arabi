import React from 'react';
import { GUEST_AVATARS } from '../constants/avatars';

interface AvatarPickerProps {
    selected: string;
    onSelect: (avatarId: string) => void;
    lang?: 'ar' | 'en' | 'fr';
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ selected, onSelect, lang = 'ar' }) => {
    const t = {
        ar: 'اختر صورتك الشخصية',
        en: 'Choose Your Avatar',
        fr: 'Choisissez Votre Avatar'
    };

    return (
        <div className="avatar-picker">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                {t[lang]}
            </h4>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {GUEST_AVATARS.map((avatar) => (
                    <button
                        key={avatar.id}
                        type="button"
                        onClick={() => onSelect(avatar.id)}
                        className={`
                            w-14 h-14 rounded-full flex items-center justify-center text-2xl
                            transition-all duration-200 hover:scale-110 active:scale-95
                            ${selected === avatar.id
                                ? 'ring-4 ring-primary shadow-lg scale-110'
                                : 'hover:shadow-md'
                            }
                        `}
                        style={{ backgroundColor: avatar.color }}
                        title={avatar.name}
                    >
                        {avatar.emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};
