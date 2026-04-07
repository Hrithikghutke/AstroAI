import React, { useState } from "react";
import { Grid, FileText, Layout, Briefcase, User, Smartphone, LayoutGrid } from "lucide-react";

const SHOWCASE_TABS = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "landing", label: "Landing Pages", icon: FileText },
  { id: "apps", label: "Advanced Apps", icon: Layout },
  { id: "business", label: "Business Tools", icon: Briefcase },
  { id: "personal", label: "Personal Tools", icon: User },
  { id: "mobile", label: "Mobile Apps", icon: Smartphone },
];

const SHOWCASE_ITEMS = [
  {
    id: 1,
    title: "Auramax headphone website",
    category: "Landing Pages",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    categoryId: "landing"
  },
  {
    id: 2,
    title: "Ops manager",
    category: "Advanced Apps",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    categoryId: "apps"
  },
  {
    id: 3,
    title: "Meditation app",
    category: "Mobile Apps",
    image: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=1200&q=80",
    categoryId: "mobile"
  },
  {
    id: 4,
    title: "Ocean research platform",
    category: "Advanced Apps",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80",
    categoryId: "apps"
  },
  {
    id: 5,
    title: "Movie launch website",
    category: "Landing Pages",
    image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&w=1200&q=80",
    categoryId: "landing"
  },
  {
    id: 6,
    title: "Location based memory app",
    category: "Personal Tools",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80",
    categoryId: "personal"
  }
];

export default function ShowcaseSection() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredItems = activeTab === "all" 
    ? SHOWCASE_ITEMS 
    : SHOWCASE_ITEMS.filter(item => item.categoryId === activeTab);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
      
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
          <h2 className="text-2xl font-bold text-white tracking-tight">Showcase</h2>
        </div>
        <p className="text-neutral-400 text-sm">
          Explore what the community is building with CrawlCube.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-10 overflow-x-auto scrollbar-none pb-2">
        {SHOWCASE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${
                isActive
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-neutral-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {filteredItems.map((item) => (
          <div key={item.id} className="group cursor-pointer">
            {/* Image Card */}
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 mb-4 ring-1 ring-inset ring-white/5 transition-all duration-300 group-hover:border-neutral-600 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <div className="absolute inset-0 bg-neutral-800 animate-pulse" /> {/* Loading state */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            
            {/* Meta */}
            <div>
              <h3 className="text-white font-semibold text-base mb-1 group-hover:text-blue-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-neutral-500 text-sm">
                {item.category}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
