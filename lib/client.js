window.__ModuleLoader__.load({
	id: "dsh-plugin-manager",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var react = require("react");
		const CSS = [
			".dpm-root{width:100%;max-width:760px;color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:18px}",
			".dpm-status{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;margin:0}",
			".dpm-error{color:var(--dsw-alias-state-error-primary);font-size:13px;line-height:20px;display:flex;gap:10px;align-items:center}",
			".dpm-error p{margin:0}",
			".dpm-error button{border:1px solid var(--dsw-alias-border-l2);background:none;color:var(--dsw-alias-label-primary);font:inherit;border-radius:6px;padding:4px 10px;cursor:pointer}",
			".dpm-group{display:flex;flex-direction:column;gap:10px}",
			".dpm-group-head{display:flex;align-items:baseline;gap:7px;padding:0 2px}",
			".dpm-group-head h3{font-size:13px;font-weight:600;line-height:20px;margin:0}",
			".dpm-group-head span{color:var(--dsw-alias-label-tertiary);font-size:12px;font-variant-numeric:tabular-nums}",
			".dpm-core-head{display:flex;align-items:center;gap:7px;padding:6px 8px;margin:0 -8px;background:none;border:none;font:inherit;color:inherit;cursor:pointer;border-radius:8px}",
			".dpm-core-head:hover{background:var(--dsw-alias-bg-layer-3)}",
			".dpm-core-head h3{font-size:13px;font-weight:600;line-height:20px;margin:0}",
			".dpm-core-head span{color:var(--dsw-alias-label-tertiary);font-size:12px;font-variant-numeric:tabular-nums}",
			".dpm-chevron{display:inline-block;font-size:9px;color:var(--dsw-alias-label-tertiary);transition:transform .15s}",
			".dpm-chevron[data-open=true]{transform:rotate(90deg)}",
			".dpm-readonly{margin-left:auto;font-size:12px;font-style:normal;color:var(--dsw-alias-label-tertiary)}",
			".dpm-cards{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}",
			".dpm-card{display:flex;align-items:center;gap:12px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;padding:12px 14px;min-width:0}",
			".dpm-card-text{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}",
			".dpm-card-title{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dpm-card-id{font-size:11px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dpm-card-side{display:flex;align-items:center;gap:10px;flex:none}",
			".dpm-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-success-primary,#34a853)}",
			".dpm-dot[data-phase=failed]{background:var(--dsw-alias-state-error-primary)}",
			".dpm-dot[data-phase=pending],.dpm-dot[data-phase=loading],.dpm-dot[data-phase=unloading]{background:var(--dsw-alias-state-warning-primary,#e6a23c)}",
			".dpm-dot[data-phase=unobserved]{background:var(--dsw-alias-label-tertiary)}",
			".dpm-tag{font-size:12px;line-height:18px;padding:0 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);white-space:nowrap}",
			".dpm-tag[data-enabled=true]{color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary)}",
			".dpm-pending{font-size:12px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}",
			".dpm-switch{position:relative;display:inline-block;width:36px;height:20px;flex:none}",
			".dpm-switch input{position:absolute;opacity:0;width:0;height:0}",
			".dpm-slider{position:absolute;inset:0;border-radius:999px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);transition:background .15s,border-color .15s;cursor:pointer}",
			".dpm-slider::before{content:\"\";position:absolute;left:2px;top:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-tertiary);transition:transform .15s,background .15s}",
			".dpm-switch input:checked + .dpm-slider{background:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary)}",
			".dpm-switch input:checked + .dpm-slider::before{transform:translateX(16px);background:#fff}",
			".dpm-switch input:disabled + .dpm-slider{opacity:.45;cursor:not-allowed}",
			".dpm-hint{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);margin:0;padding:0 2px;word-break:break-all}",
		].join("\n");
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"dsh-plugin-manager/client.css\"]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-plugin-manager";
			tag.dataset.pluginCss = "dsh-plugin-manager/client.css";
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}
		const h = react.createElement;

		function phaseText(phase) {
			if (phase === "active") return "已挂载";
			if (phase === "pending") return "等待依赖";
			if (phase === "loading") return "加载中";
			if (phase === "failed") return "挂载失败";
			if (phase === "unloading") return "卸载中";
			return "未挂载";
		}

		function api(path, options) {
			return fetch(path, options).then((res) => res.json().then((data) => {
				if (!res.ok) throw new Error(data && data.error ? String(data.error) : `HTTP ${res.status}`);
				return data;
			}));
		}

		function PluginManagerTab() {
			const [state, setState] = react.useState({ status: "loading", entries: [], patchFile: "" });
			const [error, setError] = react.useState("");
			const [pending, setPending] = react.useState("");
			const [coreOpen, setCoreOpen] = react.useState(false);

			const load = (showLoading) => {
				if (showLoading) { setState({ status: "loading", entries: [], patchFile: "" }); setError(""); }
				return api("/__plugin-manager__/list").then((data) => {
					const entries = Array.isArray(data.entries) ? data.entries : [];
					const patchFile = typeof data.patchFile === "string" ? data.patchFile : "";
					setState({ status: "ready", entries, patchFile });
					return entries;
				}, (e) => {
					setState({ status: "error", entries: [], patchFile: "" });
					setError(e && e.message ? String(e.message) : String(e));
					return null;
				});
			};

			react.useEffect(() => { load(true); }, []);

			const toggle = (entry) => {
				if (pending !== "") return;
				const target = !entry.enabled;
				setPending(entry.id);
				api("/__plugin-manager__/set-disabled", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ id: entry.rowId, disabled: !target }),
				}).then(() => {
					let attempts = 0;
					const poll = () => {
						attempts += 1;
						load(false).then((entries) => {
							let found = null;
							if (entries !== null) {
								for (let i = 0; i < entries.length; i++) {
									if (entries[i].id === entry.id) { found = entries[i]; break; }
								}
							}
							if (found !== null && found.enabled === target) { setPending(""); return; }
							if (attempts < 10) setTimeout(poll, 700);
							else setPending("");
						});
					};
					setTimeout(poll, 500);
				}, (e) => {
					setPending("");
					setError(e && e.message ? String(e.message) : String(e));
				});
			};

			const custom = [];
			const core = [];
			for (let i = 0; i < state.entries.length; i++) {
				const entry = state.entries[i];
				if (entry.custom) custom.push(entry);
				else core.push(entry);
			}

			const renderRow = (entry, operable) => h("li", { className: "dpm-card", key: entry.id },
				h("div", { className: "dpm-card-text" },
					h("strong", { className: "dpm-card-title", title: entry.name }, entry.short),
					h("code", { className: "dpm-card-id" }, entry.rowId)
				),
				h("div", { className: "dpm-card-side" },
					pending === entry.id ? h("span", { className: "dpm-pending" }, "应用中…") : null,
					entry.enabled ? h("span", {
						className: "dpm-dot",
						"data-phase": entry.phase === null ? "unobserved" : entry.phase,
						title: phaseText(entry.phase),
					}) : null,
					h("span", { className: "dpm-tag", "data-enabled": entry.enabled ? "true" : "false" }, entry.enabled ? "已启用" : "已停用"),
					h("label", {
						className: "dpm-switch",
						title: operable ? (entry.enabled ? "停用 " + entry.short : "启用 " + entry.short) : "核心组件保持现有状态，不可切换",
					},
						h("input", {
							type: "checkbox",
							checked: entry.enabled,
							disabled: !operable || pending !== "",
							onChange: operable ? () => toggle(entry) : () => {},
						}),
						h("span", { className: "dpm-slider" })
					)
				)
			);

			return h("div", { className: "dpm-root" },
				state.status === "loading" ? h("p", { className: "dpm-status" }, "正在读取插件…") : null,
				state.status === "error" ? h("div", { className: "dpm-error" },
					h("p", { role: "alert" }, error === "" ? "暂时无法读取插件。" : error),
					h("button", { type: "button", onClick: () => load(true) }, "重试")
				) : null,
				error !== "" && state.status === "ready" ? h("div", { className: "dpm-error" },
					h("p", { role: "alert" }, error),
					h("button", { type: "button", onClick: () => setError("") }, "知道了")
				) : null,
				state.status === "ready" ? h(react.Fragment, null,
					h("div", { className: "dpm-group" },
						h("div", { className: "dpm-group-head" },
							h("h3", null, "自定义插件"),
							h("span", null, String(custom.length))
						),
						custom.length === 0 ? h("p", { className: "dpm-status" }, "暂无自定义插件。") : null,
						custom.length > 0 ? h("ul", { className: "dpm-cards" }, custom.map((entry) => renderRow(entry, true))) : null,
						state.patchFile !== "" ? h("p", { className: "dpm-hint" }, "开关立即生效，并通过补丁文件持久化：" + state.patchFile) : null
					),
					h("div", { className: "dpm-group" },
						h("button", {
							type: "button",
							className: "dpm-core-head",
							"aria-expanded": coreOpen,
							onClick: () => setCoreOpen(!coreOpen),
						},
							h("span", { className: "dpm-chevron", "data-open": coreOpen ? "true" : "false", "aria-hidden": "true" }, "▶"),
							h("h3", null, "核心组件"),
							h("span", null, String(core.length)),
							h("em", { className: "dpm-readonly" }, "只读 · 保持现有状态")
						),
						coreOpen ? h("ul", { className: "dpm-cards" }, core.map((entry) => renderRow(entry, false))) : null
					)
				) : null
			);
		}

		function apply(ctx) {
			ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register(
				{ name: "settings.plugins.tab", id: "manage", order: 20, label: "插件管理" },
				() => h(PluginManagerTab),
			));
		}
		const inject = ["slots"];
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
