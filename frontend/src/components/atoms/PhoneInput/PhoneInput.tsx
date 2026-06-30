import React, { useState, useRef, useEffect } from"react";

// Country definitions: flag emoji, dial code, exact subscriber number length(s), display name
export interface CountryPhone {
 code: string; // ISO-2
 name: string;
 flag: string;
 dial: string; // e.g."+30"
 digits: number; // exact digits after the dial code
}

export const COUNTRIES: CountryPhone[] = [
 // Europe
 { code:"GR", name:"Greece", flag:"🇬🇷", dial:"+30", digits: 10 },
 { code:"CY", name:"Cyprus", flag:"🇨🇾", dial:"+357", digits: 8 },
 { code:"GB", name:"UK", flag:"🇬🇧", dial:"+44", digits: 10 },
 { code:"DE", name:"Germany", flag:"🇩🇪", dial:"+49", digits: 10 },
 { code:"FR", name:"France", flag:"🇫🇷", dial:"+33", digits: 9 },
 { code:"IT", name:"Italy", flag:"🇮🇹", dial:"+39", digits: 10 },
 { code:"ES", name:"Spain", flag:"🇪🇸", dial:"+34", digits: 9 },
 { code:"NL", name:"Netherlands", flag:"🇳🇱", dial:"+31", digits: 9 },
 { code:"BE", name:"Belgium", flag:"🇧🇪", dial:"+32", digits: 9 },
 { code:"AT", name:"Austria", flag:"🇦🇹", dial:"+43", digits: 10 },
 { code:"CH", name:"Switzerland", flag:"🇨🇭", dial:"+41", digits: 9 },
 { code:"PT", name:"Portugal", flag:"🇵🇹", dial:"+351", digits: 9 },
 { code:"PL", name:"Poland", flag:"🇵🇱", dial:"+48", digits: 9 },
 { code:"SE", name:"Sweden", flag:"🇸🇪", dial:"+46", digits: 9 },
 { code:"NO", name:"Norway", flag:"🇳🇴", dial:"+47", digits: 8 },
 { code:"DK", name:"Denmark", flag:"🇩🇰", dial:"+45", digits: 8 },
 { code:"FI", name:"Finland", flag:"🇫🇮", dial:"+358", digits: 9 },
 { code:"RO", name:"Romania", flag:"🇷🇴", dial:"+40", digits: 9 },
 { code:"BG", name:"Bulgaria", flag:"🇧🇬", dial:"+359", digits: 9 },
 { code:"HR", name:"Croatia", flag:"🇭🇷", dial:"+385", digits: 9 },
 { code:"RS", name:"Serbia", flag:"🇷🇸", dial:"+381", digits: 9 },
 { code:"SK", name:"Slovakia", flag:"🇸🇰", dial:"+421", digits: 9 },
 { code:"CZ", name:"Czech Republic", flag:"🇨🇿", dial:"+420", digits: 9 },
 { code:"HU", name:"Hungary", flag:"🇭🇺", dial:"+36", digits: 9 },
 { code:"UA", name:"Ukraine", flag:"🇺🇦", dial:"+380", digits: 9 },
 { code:"RU", name:"Russia", flag:"🇷🇺", dial:"+7", digits: 10 },
 // Middle East / Gulf
 { code:"AE", name:"UAE", flag:"🇦🇪", dial:"+971", digits: 9 },
 { code:"SA", name:"Saudi Arabia", flag:"🇸🇦", dial:"+966", digits: 9 },
 { code:"QA", name:"Qatar", flag:"🇶🇦", dial:"+974", digits: 8 },
 { code:"KW", name:"Kuwait", flag:"🇰🇼", dial:"+965", digits: 8 },
 { code:"BH", name:"Bahrain", flag:"🇧🇭", dial:"+973", digits: 8 },
 { code:"OM", name:"Oman", flag:"🇴🇲", dial:"+968", digits: 8 },
 { code:"JO", name:"Jordan", flag:"🇯🇴", dial:"+962", digits: 9 },
 { code:"LB", name:"Lebanon", flag:"🇱🇧", dial:"+961", digits: 8 },
 { code:"EG", name:"Egypt", flag:"🇪🇬", dial:"+20", digits: 10 },
 { code:"TR", name:"Turkey", flag:"🇹🇷", dial:"+90", digits: 10 },
 // South / East Asia
 { code:"IN", name:"India", flag:"🇮🇳", dial:"+91", digits: 10 },
 { code:"PK", name:"Pakistan", flag:"🇵🇰", dial:"+92", digits: 10 },
 { code:"BD", name:"Bangladesh", flag:"🇧🇩", dial:"+880", digits: 10 },
 { code:"CN", name:"China", flag:"🇨🇳", dial:"+86", digits: 11 },
 { code:"JP", name:"Japan", flag:"🇯🇵", dial:"+81", digits: 10 },
 { code:"KR", name:"South Korea", flag:"🇰🇷", dial:"+82", digits: 10 },
 // Americas
 { code:"US", name:"USA", flag:"🇺🇸", dial:"+1", digits: 10 },
 { code:"CA", name:"Canada", flag:"🇨🇦", dial:"+1", digits: 10 },
 { code:"MX", name:"Mexico", flag:"🇲🇽", dial:"+52", digits: 10 },
 { code:"BR", name:"Brazil", flag:"🇧🇷", dial:"+55", digits: 11 },
 { code:"AR", name:"Argentina", flag:"🇦🇷", dial:"+54", digits: 10 },
];

interface PhoneInputProps {
 value: string; // Full value including dial code, e.g."+306912345678"
 onChange: (value: string) => void;
 label?: string;
 required?: boolean;
 className?: string;
 error?: string;
 disabled?: boolean;
 defaultCountry?: string; // ISO-2 code, e.g."GR"
}

function parseValue(value: string): { country: CountryPhone; local: string } {
 const defaultCountry = COUNTRIES.find((c) => c.code ==="GR") || COUNTRIES[0];
 if (!value) return { country: defaultCountry, local:"" };

 // Try to match the longest dial code first
 const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
 for (const c of sorted) {
 if (value.startsWith(c.dial)) {
 return { country: c, local: value.slice(c.dial.length) };
 }
 }
 return { country: defaultCountry, local: value };
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
 value,
 onChange,
 label,
 required,
 className,
 error: externalError,
 disabled,
 defaultCountry ="GR",
}) => {
 const initialParsed = parseValue(value);
 const [country, setCountry] = useState<CountryPhone>(
 initialParsed.country.code !=="GR"
 ? initialParsed.country
 : COUNTRIES.find((c) => c.code === defaultCountry) || initialParsed.country
 );
 const [local, setLocal] = useState(initialParsed.local);
 const [open, setOpen] = useState(false);
 const [search, setSearch] = useState("");
 const dropRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 // Sync external value into internal state when it changes from outside
 useEffect(() => {
 if (!value) {
 setLocal("");
 return;
 }
 const parsed = parseValue(value);
 if (parsed.country.code !== country.code) {
 setCountry(parsed.country);
 }
 setLocal(parsed.local);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [value]);

 // Close dropdown on outside click
 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
 setOpen(false);
 setSearch("");
 }
 };
 document.addEventListener("mousedown", handler);
 return () => document.removeEventListener("mousedown", handler);
 }, []);

 const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 // Only allow digits (and strip any spaces/dashes user types)
 const raw = e.target.value.replace(/\D/g,"");
 // Clamp to exact length
 const clamped = raw.slice(0, country.digits);
 setLocal(clamped);
 onChange(country.dial + clamped);
 };

 const handleCountrySelect = (c: CountryPhone) => {
 setCountry(c);
 setLocal("");
 onChange(c.dial);
 setOpen(false);
 setSearch("");
 setTimeout(() => inputRef.current?.focus(), 50);
 };

 const localError =
 local.length > 0 && local.length !== country.digits
 ? `${country.name} requires exactly ${country.digits} digits (${local.length}/${country.digits})`
 : undefined;

 const displayError = externalError || localError;

 const filtered = COUNTRIES.filter(
 (c) =>
 c.name.toLowerCase().includes(search.toLowerCase()) ||
 c.dial.includes(search) ||
 c.code.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className={`flex flex-col gap-1 ${className ||""}`}>
 {label && (
 <label className="text-sm font-medium text-gray-700">
 {label}
 {required && <span className="text-red-500 ml-0.5">*</span>}
 </label>
 )}

 <div className="flex items-stretch rounded-xl overflow-hidden border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all bg-white shadow-sm">
 {/* Country Selector Button */}
 <div className="relative flex-shrink-0" ref={dropRef}>
 <button
 type="button"
 disabled={disabled}
 onClick={() => setOpen((o) => !o)}
 className="h-full flex items-center gap-1.5 px-3 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 transition-colors text-sm font-bold text-slate-700 focus:outline-none disabled:cursor-not-allowed min-w-[80px]"
 >
 <span className="text-lg leading-none">{country.flag}</span>
 <span className="text-slate-500 font-mono text-[11px]">{country.dial}</span>
 <svg
 className={`w-3 h-3 text-slate-400 transition-transform ${open ?"rotate-180" :""}`}
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 strokeWidth={3}
 >
 <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
 </svg>
 </button>

 {open && (
 <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
 <div className="p-2 border-b border-slate-100">
 <input
 autoFocus
 type="text"
 placeholder="Search country..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 bg-slate-50"
 />
 </div>
 <div className="max-h-56 overflow-y-auto">
 {filtered.length === 0 ? (
 <p className="text-center text-xs text-slate-400 py-4">No results</p>
 ) : (
 filtered.map((c) => (
 <button
 key={c.code}
 type="button"
 onClick={() => handleCountrySelect(c)}
 className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors group ${
 c.code === country.code ?"bg-blue-50" :""
 }`}
 >
 <span className="text-lg leading-none">{c.flag}</span>
 <div className="flex-1 min-w-0">
 <span className="text-xs font-bold text-slate-800 block truncate">{c.name}</span>
 <span className="text-[10px] text-slate-400 font-mono">{c.dial} · {c.digits} digits</span>
 </div>
 {c.code === country.code && (
 <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 )}
 </button>
 ))
 )}
 </div>
 </div>
 )}
 </div>

 {/* Number Input */}
 <div className="flex-1 relative flex items-center">
 <input
 ref={inputRef}
 type="tel"
 inputMode="numeric"
 pattern="[0-9]*"
 disabled={disabled}
 value={local}
 onChange={handleLocalChange}
 placeholder={"X".repeat(country.digits).replace(/X/g,"0")}
 maxLength={country.digits}
 className="w-full h-full px-3 py-2.5 text-sm font-bold text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300 placeholder:font-normal disabled:cursor-not-allowed"
 />
 {/* Live digit counter */}
 <div className={`flex-shrink-0 pr-3 text-[10px] font-black tabular-nums transition-colors ${
 local.length === country.digits
 ?"text-emerald-500"
 : local.length > 0
 ?"text-amber-500"
 :"text-slate-300"
 }`}>
 {local.length}/{country.digits}
 </div>
 </div>
 </div>

 {/* Progress bar */}
 {local.length > 0 && local.length < country.digits && (
 <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-amber-400 transition-all duration-200"
 style={{ width: `${(local.length / country.digits) * 100}%` }}
 />
 </div>
 )}
 {local.length === country.digits && (
 <div className="h-0.5 bg-emerald-400 rounded-full" />
 )}

 {displayError && (
 <span className="text-[11px] font-bold text-red-500 flex items-center gap-1">
 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
 </svg>
 {displayError}
 </span>
 )}
 </div>
 );
};
