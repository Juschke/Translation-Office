// Margin/Markup Controls - Only visible when unit mode and partner price exists
{
    priceMode === 'unit' && partnerPrice && (
        <>
            <div className="col-span-4 space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marge-Typ</label>
                <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 h-10">
                    <button onClick={() => setMarginType('markup')} className={clsx("flex-1 text-[9px] font-bold uppercase rounded transition", marginType === 'markup' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}>Aufschlag</button>
                    <button onClick={() => setMarginType('discount')} className={clsx("flex-1 text-[9px] font-bold uppercase rounded transition", marginType === 'discount' ? "bg-white text-red-600 shadow-sm" : "text-slate-400")}>Rabatt</button>
                </div>
            </div>

            <div className="col-span-4 space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {marginType === 'markup' ? 'Aufschlag %' : 'Rabatt %'}
                </label>
                <div className="relative">
                    <input
                        type="number"
                        step="1"
                        className={clsx(
                            "w-full px-3 h-10 border rounded text-sm outline-none shadow-sm font-bold pr-8",
                            marginType === 'markup' ? "border-emerald-300 text-emerald-700 bg-emerald-50/30 focus:border-emerald-500" : "border-red-300 text-red-700 bg-red-50/30 focus:border-red-500"
                        )}
                        placeholder="30"
                        value={marginPercent}
                        onChange={(e) => setMarginPercent(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
            </div>
        </>
    )
}
