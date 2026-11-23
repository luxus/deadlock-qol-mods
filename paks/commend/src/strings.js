// Deadlock Commend's words, per game language. Tokens are '#Dc_<Name>'. English and German by hand;
// the others are machine-made, corrections welcome. Swiss German spelling: ss, no ß.
const STRINGS = {
	english: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Reset Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Commend buttons',
		Dc_Commend_Desc: 'On the post-game screens, buttons to commend your team, the enemy, everyone, or to return commends.',
		Dc_Team: 'Team',
		Dc_Enemy: 'Enemy',
		Dc_All: 'All',
		Dc_Return: 'Return'
	},
	german: { // Swiss ss
		Dc_Tab: 'Commend',
		Dc_Reset: 'Commend zurücksetzen',
		Dc_Section: 'Commend',
		Dc_Commend: 'Commend-Tasten',
		Dc_Commend_Desc: 'Auf den Bildschirmen nach dem Match: Tasten, um dein Team, die Gegner oder alle zu commenden, oder Commends zurückzugeben.',
		Dc_Team: 'Team',
		Dc_Enemy: 'Gegner',
		Dc_All: 'Alle',
		Dc_Return: 'Zurück'
	},
	french: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Réinitialiser Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Boutons de commend',
		Dc_Commend_Desc: 'Sur les écrans d\'après-match : boutons pour recommander votre équipe, l\'ennemi, tout le monde, ou renvoyer les commends.',
		Dc_Team: 'Équipe',
		Dc_Enemy: 'Ennemi',
		Dc_All: 'Tous',
		Dc_Return: 'Retour'
	},
	spanish: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Restablecer Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Botones de commend',
		Dc_Commend_Desc: 'En las pantallas de fin de partida: botones para recomendar a tu equipo, al enemigo, a todos, o devolver commends.',
		Dc_Team: 'Equipo',
		Dc_Enemy: 'Enemigo',
		Dc_All: 'Todos',
		Dc_Return: 'Devolver'
	},
	latam: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Restablecer Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Botones de commend',
		Dc_Commend_Desc: 'En las pantallas de fin de partida: botones para recomendar a tu equipo, al enemigo, a todos, o devolver commends.',
		Dc_Team: 'Equipo',
		Dc_Enemy: 'Enemigo',
		Dc_All: 'Todos',
		Dc_Return: 'Devolver'
	},
	brazilian: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Redefinir Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Botões de commend',
		Dc_Commend_Desc: 'Nas telas pós-partida: botões para recomendar seu time, o inimigo, todos, ou retribuir commends.',
		Dc_Team: 'Time',
		Dc_Enemy: 'Inimigo',
		Dc_All: 'Todos',
		Dc_Return: 'Retribuir'
	},
	italian: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Ripristina Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Pulsanti commend',
		Dc_Commend_Desc: 'Nelle schermate post-partita: pulsanti per raccomandare la tua squadra, i nemici, tutti, o ricambiare i commend.',
		Dc_Team: 'Squadra',
		Dc_Enemy: 'Nemici',
		Dc_All: 'Tutti',
		Dc_Return: 'Ricambia'
	},
	polish: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Resetuj Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Przyciski commend',
		Dc_Commend_Desc: 'Na ekranach po meczu: przyciski do polecenia swojej drużyny, wrogów, wszystkich, albo oddania commend.',
		Dc_Team: 'Drużyna',
		Dc_Enemy: 'Wrogowie',
		Dc_All: 'Wszyscy',
		Dc_Return: 'Oddaj'
	},
	czech: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Resetovat Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Tlačítka commend',
		Dc_Commend_Desc: 'Na obrazovkách po zápase: tlačítka pro commend týmu, soupeřů, všech, nebo pro opětování.',
		Dc_Team: 'Tým',
		Dc_Enemy: 'Soupeři',
		Dc_All: 'Všichni',
		Dc_Return: 'Vrátit'
	},
	russian: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Сбросить Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Кнопки commend',
		Dc_Commend_Desc: 'На экранах после матча: кнопки, чтобы отметить свою команду, врагов, всех, или ответить на commend.',
		Dc_Team: 'Команда',
		Dc_Enemy: 'Враги',
		Dc_All: 'Все',
		Dc_Return: 'Ответ'
	},
	ukrainian: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Скинути Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Кнопки commend',
		Dc_Commend_Desc: 'На екранах після матчу: кнопки, щоб відзначити свою команду, ворогів, усіх, або відповісти на commend.',
		Dc_Team: 'Команда',
		Dc_Enemy: 'Вороги',
		Dc_All: 'Усі',
		Dc_Return: 'Відповідь'
	},
	turkish: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Commend\'ı sıfırla',
		Dc_Section: 'Commend',
		Dc_Commend: 'Commend düğmeleri',
		Dc_Commend_Desc: 'Maç sonu ekranlarında: takımını, rakibi, herkesi commend etmek veya commendleri iade etmek için düğmeler.',
		Dc_Team: 'Takım',
		Dc_Enemy: 'Rakip',
		Dc_All: 'Herkes',
		Dc_Return: 'İade'
	},
	indonesian: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Reset Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Tombol commend',
		Dc_Commend_Desc: 'Di layar pasca-pertandingan: tombol untuk commend tim, lawan, semua orang, atau membalas commend.',
		Dc_Team: 'Tim',
		Dc_Enemy: 'Lawan',
		Dc_All: 'Semua',
		Dc_Return: 'Balas'
	},
	thai: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'รีเซ็ต Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'ปุ่ม commend',
		Dc_Commend_Desc: 'บนหน้าจอหลังแมตช์: ปุ่มสำหรับ commend ทีม ฝ่ายตรงข้าม ทุกคน หรือตอบกลับ commend',
		Dc_Team: 'ทีม',
		Dc_Enemy: 'ศัตรู',
		Dc_All: 'ทั้งหมด',
		Dc_Return: 'ตอบกลับ'
	},
	japanese: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Commendをリセット',
		Dc_Section: 'Commend',
		Dc_Commend: 'Commendボタン',
		Dc_Commend_Desc: '試合後の画面で、味方・敵・全員をcommendしたり、commendを返ししたりするボタン。',
		Dc_Team: '味方',
		Dc_Enemy: '敵',
		Dc_All: '全員',
		Dc_Return: '返す'
	},
	koreana: {
		Dc_Tab: 'Commend',
		Dc_Reset: 'Commend 초기화',
		Dc_Section: 'Commend',
		Dc_Commend: 'Commend 버튼',
		Dc_Commend_Desc: '경기 종료 화면에서 아군, 적, 모두 commend하거나 commend를 돌려주는 버튼.',
		Dc_Team: '아군',
		Dc_Enemy: '적',
		Dc_All: '모두',
		Dc_Return: '답례'
	},
	schinese: {
		Dc_Tab: 'Commend',
		Dc_Reset: '重置 Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Commend 按钮',
		Dc_Commend_Desc: '在赛后界面：用于称赞己方、敌方、所有人，或回赠 commend 的按钮。',
		Dc_Team: '己方',
		Dc_Enemy: '敌方',
		Dc_All: '全部',
		Dc_Return: '回赠'
	},
	tchinese: {
		Dc_Tab: 'Commend',
		Dc_Reset: '重置 Commend',
		Dc_Section: 'Commend',
		Dc_Commend: 'Commend 按鈕',
		Dc_Commend_Desc: '在賽後畫面：用來稱讚己方、敵方、所有人，或回贈 commend 的按鈕。',
		Dc_Team: '己方',
		Dc_Enemy: '敵方',
		Dc_All: '全部',
		Dc_Return: '回贈'
	}
};
