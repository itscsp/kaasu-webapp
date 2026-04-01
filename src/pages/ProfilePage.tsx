import { ChevronRight, LogOut, Tag as TagIcon, BarChart2, Archive } from "lucide-react";

interface Props {
  onBack: () => void;
  onShowTags: () => void;
  onShowSummary: () => void;
  onShowArchive: () => void;
  onLogout: () => void;
}

export default function ProfilePage({ onBack, onShowTags, onShowSummary, onShowArchive, onLogout }: Props) {
  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={onBack} className="header-action-btn">Back</button>
        <span className="header-title">Profile</span>
        <span className="w-12" />
      </div>

      <div className="screen-body py-6">
        <div className="flex flex-col gap-3">
          {[
            { icon: BarChart2, label: "View Summary", action: onShowSummary, color: "text-blue-400" },
            { icon: TagIcon, label: "Manage Tags", action: onShowTags, color: "text-purple-400" },
            { icon: Archive, label: "View Archive", action: onShowArchive, color: "text-amber-400" },
          ].map((item, i) => (
            <button 
              key={i}
              onClick={item.action}
              className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-white/5 border border-white/5 ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon size={20} />
                </div>
                <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">{item.label}</span>
              </div>
              <ChevronRight className="text-gray-600 group-hover:text-gray-300 transition-colors" size={20} />
            </button>
          ))}
          
          <div className="mt-4 pt-4 border-t border-white/5">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-between p-5 bg-[hsl(0_80%_65%)]/5 border border-[hsl(0_80%_65%)]/20 rounded-2xl hover:bg-[hsl(0_80%_65%)]/10 transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-4 text-[hsl(0_80%_65%)]">
                <div className="p-2.5 rounded-xl bg-[hsl(0_80%_65%)]/10 border border-[hsl(0_80%_65%)]/10 group-hover:scale-110 transition-transform">
                  <LogOut size={20} />
                </div>
                <span className="font-bold uppercase tracking-wider text-xs">Sign Out</span>
              </div>
              <ChevronRight className="text-[hsl(0_80%_65%)]/40" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
