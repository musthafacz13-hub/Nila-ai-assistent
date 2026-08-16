import { FileText, Globe, Languages, CloudSun } from 'lucide-react';

interface QuickActionsProps {
  onSelect: (message: string) => void;
}

const actions = [
  {
    icon: Globe,
    label: 'News',
    prompt: 'ഇന്നത്തെ കോഴിക്കോട് വാർത്ത എന്താണ്?',
  },
  {
    icon: CloudSun,
    label: 'Weather',
    prompt: 'എറണാകുളത്തെ ഇപ്പോഴത്തെ കാലാവസ്ഥ എങ്ങനെയാണ്?',
  },
  {
    icon: Languages,
    label: 'Translate',
    prompt: 'Translate "How are you doing today?" to Malayalam.',
  },
  {
    icon: FileText,
    label: 'Explain',
    prompt: 'Onam ആഘോഷത്തെക്കുറിച്ച് ചുരുക്കത്തിൽ പറയാമോ?',
  },
];

export function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-lg mx-auto mt-8">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => onSelect(action.prompt)}
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-left transition-all duration-200 group"
        >
          <div className="text-neutral-400 group-hover:text-neutral-600 transition-colors">
            <action.icon size={20} strokeWidth={2} />
          </div>
          <span className="text-sm font-medium text-neutral-700">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
