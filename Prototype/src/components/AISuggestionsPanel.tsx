/**
 * AI Suggestions Panel
 * 
 * Displays AI-powered dispatching recommendations
 * 
 * @module components/AISuggestionsPanel
 */

import React from 'react';
import { DispatchSuggestion, SuggestionCategory } from '../engine/AIDispatcher';
import {
    Brain,
    Lightbulb,
    ShieldCheck,
    Wrench,
    Scale,
    Zap,
    ChevronRight,
} from 'lucide-react';

interface AISuggestionsPanelProps {
    suggestions: DispatchSuggestion[];
    onApplySuggestion?: (suggestion: DispatchSuggestion) => void;
}

const CATEGORY_ICONS: Record<SuggestionCategory, React.ReactNode> = {
    EFFICIENCY: <Zap className="w-4 h-4" />,
    SAFETY: <ShieldCheck className="w-4 h-4" />,
    MAINTENANCE: <Wrench className="w-4 h-4" />,
    LOAD_BALANCE: <Scale className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<SuggestionCategory, string> = {
    EFFICIENCY: 'text-cyan-400 bg-cyan-900/30 border-cyan-500/30',
    SAFETY: 'text-red-400 bg-red-900/30 border-red-500/30',
    MAINTENANCE: 'text-amber-400 bg-amber-900/30 border-amber-500/30',
    LOAD_BALANCE: 'text-purple-400 bg-purple-900/30 border-purple-500/30',
};

const PRIORITY_BADGES = {
    LOW: 'bg-slate-600 text-slate-300',
    MEDIUM: 'bg-blue-600 text-blue-100',
    HIGH: 'bg-orange-600 text-orange-100',
};

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
    suggestions,
    onApplySuggestion,
}) => {
    if (suggestions.length === 0) {
        return (
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">AI Suggestions</h3>
                </div>
                <div className="text-center py-6 text-slate-500">
                    <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No suggestions at this time</p>
                    <p className="text-xs mt-1">System running optimally</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">AI Suggestions</h3>
                </div>
                <span className="text-xs bg-purple-600/50 px-2 py-0.5 rounded text-purple-200">
                    {suggestions.length} active
                </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
                {suggestions.map((suggestion) => (
                    <div
                        key={suggestion.id}
                        className={`border rounded-lg p-3 ${CATEGORY_COLORS[suggestion.category]}`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {CATEGORY_ICONS[suggestion.category]}
                                <span className="font-bold text-sm">{suggestion.title}</span>
                            </div>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_BADGES[suggestion.priority]}`}>
                                {suggestion.priority}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 mb-2">{suggestion.description}</p>

                        {/* Action */}
                        <div className="bg-black/20 rounded p-2 mb-2">
                            <div className="text-xs text-slate-400 mb-1">Recommended Action:</div>
                            <div className="text-sm font-medium text-white">{suggestion.action}</div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 italic">"{suggestion.reasoning}"</span>
                            <span className="text-emerald-400">{suggestion.estimatedImpact}</span>
                        </div>

                        {/* Apply Button */}
                        {onApplySuggestion && (
                            <button
                                onClick={() => onApplySuggestion(suggestion)}
                                className="mt-2 w-full py-1.5 bg-purple-600/50 hover:bg-purple-600 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all"
                            >
                                Apply Suggestion <ChevronRight className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AISuggestionsPanel;
