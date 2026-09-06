import { useState } from 'react';
import { Globe, Wand2, ChevronDown, Check, Sparkles, Heart } from 'lucide-react';
import { SpeechTone } from '../types';
import { SUPPORTED_LANGUAGES, TONE_OPTIONS } from '../data/constants';

interface LanguageToneBarProps {
  selectedLanguage: string;
  onSelectLanguage: (langName: string, sampleText?: string) => void;
  selectedTone: SpeechTone;
  onSelectTone: (tone: SpeechTone) => void;
  onTranslateClick?: () => void;
  isTranslating?: boolean;
}

export function LanguageToneBar({
  selectedLanguage,
  onSelectLanguage,
  selectedTone,
  onSelectTone,
  onTranslateClick,
  isTranslating,
}: LanguageToneBarProps) {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'feelings' | 'styles'>('all');

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.name.toLowerCase() === selectedLanguage.toLowerCase()) ||
    SUPPORTED_LANGUAGES[0];

  const currentToneObj =
    TONE_OPTIONS.find((t) => t.id === selectedTone) || TONE_OPTIONS[0];

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedTones = TONE_OPTIONS.filter((t) => {
    if (activeCategory === 'feelings') return t.isEmotion;
    if (activeCategory === 'styles') return !t.isEmotion;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Upper Row: Language Picker + Translate CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Language & Expressions</span>
          </label>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative">
          {/* Custom Select Dropdown for Language */}
          <div className="relative">
            <button
              type="button"
              id="language-select-btn"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-200 hover:bg-zinc-700 hover:border-zinc-600 transition-colors shadow-xs"
            >
              <span className="text-base leading-none">{currentLangObj.flag}</span>
              <span>{currentLangObj.name}</span>
              <span className="text-zinc-400 text-[11px] font-normal">({currentLangObj.nativeName})</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-64 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 z-50 p-2 space-y-1 max-h-72 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Search languages (English, Hinglish, etc)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-xl outline-none focus:border-indigo-500 mb-1"
                    autoFocus
                  />
                  {filteredLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onSelectLanguage(lang.name, lang.sampleText);
                        setLangDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left ${
                        selectedLanguage === lang.name
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{lang.flag}</span>
                        <span>{lang.name}</span>
                        <span
                          className={`text-[10px] ${
                            selectedLanguage === lang.name ? 'text-indigo-200' : 'text-zinc-500'
                          }`}
                        >
                          {lang.nativeName}
                        </span>
                      </div>
                      {selectedLanguage === lang.name && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* AI Translate Assistant Button */}
          {onTranslateClick && (
            <button
              type="button"
              id="translate-script-btn"
              onClick={onTranslateClick}
              disabled={isTranslating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-400 active:scale-95 transition-all"
              title="Translate current script to the selected language using AI"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isTranslating ? 'Translating...' : `Translate to ${currentLangObj.name}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Category Tabs for Feelings & Expressions vs Delivery Styles */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeCategory === 'all'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            All Nuances ({TONE_OPTIONS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('feelings')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
              activeCategory === 'feelings'
                ? 'bg-pink-900/40 text-pink-300 border border-pink-700/50'
                : 'text-zinc-400 hover:text-pink-300 hover:bg-zinc-800/60'
            }`}
          >
            <Heart className="w-3 h-3 text-pink-400" />
            <span>Feelings & Expressions (12)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('styles')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
              activeCategory === 'styles'
                ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50'
                : 'text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800/60'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Styles</span>
          </button>
        </div>

        {/* Active emotion preview snippet */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400">
          <span className="text-zinc-500">Feeling:</span>
          <span className="font-semibold text-zinc-200 flex items-center gap-1">
            <span>{currentToneObj.emoji}</span>
            <span>{currentToneObj.label}</span>
          </span>
        </div>
      </div>

      {/* Tone / Emotion Pills */}
      <div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {displayedTones.map((t) => {
            const isSelected = selectedTone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                id={`tone-pill-${t.id}`}
                onClick={() => onSelectTone(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? t.isEmotion
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
                title={t.description}
              >
                <span className="text-sm leading-none">{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-zinc-400 italic px-1 pt-0.5">
          {currentToneObj.emoji} <strong className="text-zinc-300 font-medium not-italic">{currentToneObj.label}:</strong> {currentToneObj.description}
        </p>
      </div>
    </div>
  );
}
