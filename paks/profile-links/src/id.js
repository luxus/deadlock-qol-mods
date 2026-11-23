// SPEC-OPEN O-P5: hidden {i:…} bindings are read first. Visible FriendID and AccountID text are the fallback.
// One profile or card source. Empty, a token, or more than one candidate is no id.
const pageId = value => {
	const text = tidy(value);
	if (!text || /[{}]/.test(text) || text.charAt(0) === '#' || /^nan$/i.test(text)) return '';
	const exact = parseExactAccount(text);
	if (exact !== null) return exact;
	const found = [];
	scanSteamTokens(text, found);
	const phrase = /(?:^|[^a-z0-9])((?:account\s*id|friend\s*code))(?![a-z0-9])/i.exec(text);
	if (phrase) {
		const rest = text.slice(phrase.index + phrase[0].length).replace(/’/g, "'").replace(/^[\s:#-]+/, '');
		if (rest && !/[^0-9\s.,'_-]/.test(rest)) {
			const digits = stripZeros(rest.replace(/\D/g, ''));
			if (/^\d{17}$/.test(digits)) pushUnique(found, fromSteam64(digits));
			else pushUnique(found, inRange(digits) ? digits : '');
		}
		let m;
		const reShort = /(^|\D)(\d{6,10})(?!\d)/g;
		while ((m = reShort.exec(text))) { const id = stripZeros(m[2]); pushUnique(found, inRange(id) ? id : ''); }
	}
	return found.length === 1 ? found[0] : '';
};

// Several sources. One distinct id wins. Two different ids are a conflict.
const resolveIds = list => {
	const ids = [];
	(list || []).forEach(v => pushUnique(ids, pageId(v)));
	const conflict = ids.length > 1;
	return { id: conflict ? '' : (ids[0] || ''), conflict: conflict };
};
const agreeIds = list => resolveIds(list).id;

// Scoreboard source. Valid Steam3/Steam64/plain id wins; otherwise a clean 6-10 digit run.
const boardId = value => {
	const raw = tidy(value);
	if (!raw || /[{}]/.test(raw) || raw.charAt(0) === '#') return '';
	const parsed = pageId(raw);
	if (parsed) return parsed;
	if (/\[U:/i.test(raw)) return '';
	const text = raw.replace(/\D/g, '');
	if (!/^\d{6,10}$/.test(text)) return '';
	const id = stripZeros(text);
	return inRange(id) ? id : '';
};
