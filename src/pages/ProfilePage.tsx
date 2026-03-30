import { ChevronRight, LogOut, Tag as TagIcon, BarChart2 } from "lucide-react";

interface Props {
  onBack: () => void;
  onShowTags: () => void;
  onShowSummary: () => void;
  onLogout: () => void;
}

export default function ProfilePage({ onBack, onShowTags, onShowSummary, onLogout }: Props) {
  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={onBack} className="header-action-btn">Back</button>
        <span className="header-title">Profile</span>
        <span className="w-12" />
      </div>

      <div className="screen-body py-6">
        <div className="flex flex-col gap-4">
          <button 
            onClick={onShowSummary}
            className="flex items-center justify-between p-4 sketch-box hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <BarChart2 className="text-[hsl(var(--muted-foreground))]" size={20} />
              <span className="font-medium text-[hsl(var(--foreground))]">View Summary</span>
            </div>
            <ChevronRight className="text-[hsl(var(--muted-foreground))]" size={20} />
          </button>

          <button 
            onClick={onShowTags}
            className="flex items-center justify-between p-4 sketch-box hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <TagIcon className="text-[hsl(var(--muted-foreground))]" size={20} />
              <span className="font-medium text-[hsl(var(--foreground))]">Manage Tags</span>
            </div>
            <ChevronRight className="text-[hsl(var(--muted-foreground))]" size={20} />
          </button>
          
          <button 
            onClick={onLogout}
            className="flex items-center justify-between p-4 sketch-box hover:opacity-80 transition-opacity border-[hsl(var(--destructive))] bg-transparent"
          >
            <div className="flex items-center gap-3 text-[hsl(var(--destructive))]">
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
