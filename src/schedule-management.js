let scheduleRooms = [];
let scheduleStaff = [];
let scheduleSettings = { amStart: '08:00', amEnd: '12:00', pmStart: '13:00', pmEnd: '17:00', duration: 30 };
let scheduleData = {};
let scheduleDates = [];
let currentScheduleDate = null;
let currentScheduleRoleFilter = 'all';
let currentScheduleEditingSlot = null;
let orderManagementInited = false;

function scheduleTimeToMins(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function scheduleMinsToTime(m) {
    return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
}

function initOrderManagement() {
    if (!orderManagementInited) {
        scheduleRooms = [
            { id: 'r1', name: '诊室 101' },
            { id: 'r2', name: '诊室 102' },
            { id: 'r3', name: '验光室 1' },
            { id: 'r4', name: '验光室 2' },
            { id: 'r5', name: '训练室' }
        ];

        scheduleStaff = [
            { id: 'd1', name: '李主任', role: 'doctor', roleName: '医生', defaultCap: 1, color: 'bg-blue-500' },
            { id: 'd2', name: '王医生', role: 'doctor', roleName: '医生', defaultCap: 3, color: 'bg-blue-500' },
            { id: 'o1', name: '张视光', role: 'optometrist', roleName: '视光师', defaultCap: 2, color: 'bg-primary-500' },
            { id: 'o2', name: '赵视光', role: 'optometrist', roleName: '视光师', defaultCap: 2, color: 'bg-primary-500' },
            { id: 't1', name: '王视训', role: 'trainer', roleName: '视训师', defaultCap: 0, color: 'bg-teal-500' },
            { id: 'r1', name: '赵前台', role: 'receptionist', roleName: '前台', defaultCap: 0, color: 'bg-amber-500' }
        ];

        scheduleDates = [];
        scheduleData = {};
        const today = new Date();
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const id = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            scheduleDates.push({
                id,
                shortLabel: `${d.getMonth() + 1}.${d.getDate()}`,
                fullLabel: `${d.getMonth() + 1}月${d.getDate()}日`,
                day: i === 0 ? '今天' : days[d.getDay()]
            });
            scheduleData[id] = { am: [], pm: [], rooms: { am: {}, pm: {} }, slots: {} };
        }

        const todayId = scheduleDates[0].id;
        toggleScheduleStaffShift(todayId, 'd1', 'am', true);
        setScheduleStaffRoom(todayId, 'd1', 'am', 'r1');
        toggleScheduleStaffShift(todayId, 'o1', 'am', true);
        setScheduleStaffRoom(todayId, 'o1', 'am', 'r3');
        toggleScheduleStaffShift(todayId, 'd1', 'pm', true);
        setScheduleStaffRoom(todayId, 'd1', 'pm', 'r1');
        toggleScheduleStaffShift(todayId, 'r1', 'am', true);
        currentScheduleDate = todayId;
        orderManagementInited = true;
    }

    selectScheduleDate(currentScheduleDate || scheduleDates[0].id);
}

function toggleScheduleStaffShift(dateId, staffId, period, isWorking) {
    const day = scheduleData[dateId];
    if (!day) return;
    if (isWorking) {
        if (!day[period].includes(staffId)) day[period].push(staffId);
        const staff = scheduleStaff.find(s => s.id === staffId);
        if (!staff) return;
        if (staff.role === 'doctor' || staff.role === 'optometrist') {
            if (!day.slots[staffId]) day.slots[staffId] = {};
            let curr = scheduleTimeToMins(period === 'am' ? scheduleSettings.amStart : scheduleSettings.pmStart);
            const end = scheduleTimeToMins(period === 'am' ? scheduleSettings.amEnd : scheduleSettings.pmEnd);
            while (curr < end) {
                const t = scheduleMinsToTime(curr);
                if (day.slots[staffId][t] === undefined) day.slots[staffId][t] = staff.defaultCap;
                curr += scheduleSettings.duration;
            }
        }
    } else {
        day[period] = day[period].filter(id => id !== staffId);
        delete day.rooms[period][staffId];
        if (!day.am.includes(staffId) && !day.pm.includes(staffId)) {
            delete day.slots[staffId];
        } else {
            let curr = scheduleTimeToMins(period === 'am' ? scheduleSettings.amStart : scheduleSettings.pmStart);
            const end = scheduleTimeToMins(period === 'am' ? scheduleSettings.amEnd : scheduleSettings.pmEnd);
            while (curr < end) {
                delete day.slots[staffId][scheduleMinsToTime(curr)];
                curr += scheduleSettings.duration;
            }
        }
    }
}

function setScheduleStaffRoom(dateId, staffId, period, roomId) {
    if (!scheduleData[dateId]) return;
    if (roomId === '') delete scheduleData[dateId].rooms[period][staffId];
    else scheduleData[dateId].rooms[period][staffId] = roomId;
}

function selectScheduleDate(dateId) {
    currentScheduleDate = dateId;
    const strip = document.getElementById('schedule-date-strip');
    if (!strip) return;
    strip.innerHTML = scheduleDates.map((d, i) => {
        const active = d.id === currentScheduleDate;
        return `<div onclick="selectScheduleDate('${d.id}')" class="flex-1 min-w-[70px] py-2 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${ i === 0 && 'font-bold text-primary-600 border-primary-600'} ${active ? 'bg-primary-600 text-white border border-primary-600 shadow-md scale-105' : 'bg-white text-gray-600 border border-gray-200'}"><span class="text-[10px] ${i === 0 && 'text-primary-600'} ${active ? 'text-primary-100' : 'text-gray-400'}">${d.day}</span><span class="text-sm font-bold">${d.shortLabel}</span></div>`;
    }).join('');
    renderScheduleMainView();
}

function getScheduleRoomBadge(roomId) {
    if (!roomId) return `<span class="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-[10px] font-bold border border-gray-200">未分配</span>`;
    const room = scheduleRooms.find(r => r.id === roomId);
    return `<span class="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-[10px] font-bold border border-primary-200"><i class="ph-bold ph-door-open mr-1"></i>${room ? room.name : '未分配'}</span>`;
}

function renderScheduleListRow(staffId, period) {
    const staff = scheduleStaff.find(s => s.id === staffId);
    const roomId = scheduleData[currentScheduleDate].rooms[period][staffId];
    if (!staff) return '';
    return `<div class="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white transition-colors"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full ${staff.color} text-white flex items-center justify-center text-xs font-bold shadow-sm">${staff.name.charAt(0)}</div><div><div class="text-sm font-bold text-gray-700">${staff.name}</div><div class="text-[10px] text-gray-400">${staff.roleName}</div></div></div><div>${getScheduleRoomBadge(roomId)}</div></div>`;
}

function renderScheduleMainView() {
    const dateObj = scheduleDates.find(d => d.id === currentScheduleDate);
    const day = scheduleData[currentScheduleDate];
    const title = document.getElementById('schedule-main-title');
    const status = document.getElementById('schedule-main-status');
    const amList = document.getElementById('schedule-main-am-list');
    const pmList = document.getElementById('schedule-main-pm-list');
    if (!dateObj || !day || !title || !status || !amList || !pmList) return;

    title.innerText = `${dateObj.fullLabel} 排班详情`;
    const hasPlan = day.am.length || day.pm.length;
    status.innerText = hasPlan ? '已排班' : '未排班';
    status.className = `px-2.5 py-1 rounded text-xs font-bold ${hasPlan ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`;

    amList.innerHTML = day.am.length ? day.am.map(id => renderScheduleListRow(id, 'am')).join('') : '<div class="text-center text-sm text-gray-400 py-4">暂未配置</div>';
    pmList.innerHTML = day.pm.length ? day.pm.map(id => renderScheduleListRow(id, 'pm')).join('') : '<div class="text-center text-sm text-gray-400 py-4">暂未配置</div>';

    renderScheduleTimeline('schedule-main-timeline-container', false);
}

function renderScheduleTimeline(containerId, isEdit) {
    const day = scheduleData[currentScheduleDate];
    const container = document.getElementById(containerId);
    if (!day || !container) return;
    const activeIds = Array.from(new Set([...day.am, ...day.pm])).filter(id => {
        const staff = scheduleStaff.find(s => s.id === id);
        return staff && (staff.role === 'doctor' || staff.role === 'optometrist');
    });
    if (!activeIds.length) {
        container.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-400"><p class="text-sm">暂无号源数据</p></div>`;
        return;
    }

    const allTimes = new Set();
    activeIds.forEach(id => Object.keys(day.slots[id] || {}).forEach(t => allTimes.add(t)));
    const sortedTimes = Array.from(allTimes).sort((a, b) => scheduleTimeToMins(a) - scheduleTimeToMins(b));

    container.innerHTML = activeIds.map(id => {
        const staff = scheduleStaff.find(s => s.id === id);
        const blocks = sortedTimes.map(time => {
            const cap = day.slots[id][time];
            if (cap === undefined) return `<div class="w-14 shrink-0"></div>`;
            const click = isEdit ? `onclick="openScheduleCapPopover(event,'${id}','${time}',${cap})"` : '';
            return `<div ${click} class="shrink-0 w-16 h-14 rounded-xl border ${cap > 0 ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-gray-100 border-gray-200 text-gray-400'} ${isEdit ? 'cursor-pointer hover:bg-primary-100' : ''} flex flex-col items-center justify-center"><span class="text-[10px] font-medium">${time}</span><span class="text-sm font-bold">${cap === 0 ? '停诊' : `${cap}人`}</span></div>`;
        }).join('');
        return `<div class="flex items-center gap-3 bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100"><div class="w-16 shrink-0 flex flex-col items-center border-r border-gray-200 pr-2"><div class="w-8 h-8 rounded-full ${staff.color} text-white flex items-center justify-center text-sm font-bold mb-1">${staff.name.charAt(0)}</div><span class="text-[10px] font-bold text-gray-700">${staff.name}</span></div><div class="flex-1 flex gap-2 overflow-x-auto no-scrollbar">${blocks}</div></div>`;
    }).join('');
}

function openScheduleEditDrawer() {
    const title = document.getElementById('schedule-drawer-title');
    const drawer = document.getElementById('schedule-edit-drawer');
    const dateObj = scheduleDates.find(d => d.id === currentScheduleDate);
    if (!title || !drawer || !dateObj) return;
    title.innerText = `编辑 ${dateObj.fullLabel} 排班`;
    renderScheduleEditDrawer();
    drawer.classList.remove('hidden');
}

function closeScheduleEditDrawer() {
    const drawer = document.getElementById('schedule-edit-drawer');
    if (!drawer) return;
    drawer.classList.add('hidden');
    renderScheduleMainView();
}

function setScheduleRoleFilter(role) {
    currentScheduleRoleFilter = role;
    document.querySelectorAll('.schedule-filter-btn').forEach(btn => {
        if (btn.dataset.role === role) {
            btn.classList.add('bg-white', 'shadow-sm', 'font-bold', 'text-gray-700');
            btn.classList.remove('text-gray-500', 'hover:text-gray-700');
        } else {
            btn.classList.remove('bg-white', 'shadow-sm', 'font-bold', 'text-gray-700');
            btn.classList.add('text-gray-500', 'hover:text-gray-700');
        }
    });
    renderScheduleEditDrawer();
}

function renderScheduleEditDrawer() {
    const day = scheduleData[currentScheduleDate];
    const list = document.getElementById('schedule-drawer-staff-list');
    if (!day || !list) return;
    const roomOptions = `<option value="">未分配</option>${scheduleRooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}`;
    const filtered = scheduleStaff.filter(s => {
        if (currentScheduleRoleFilter === 'all') return true;
        if (currentScheduleRoleFilter === 'doctor') return s.role === 'doctor';
        if (currentScheduleRoleFilter === 'optometrist') return s.role === 'optometrist';
        return s.role !== 'doctor' && s.role !== 'optometrist';
    });

    list.innerHTML = filtered.map(staff => {
        const inAm = day.am.includes(staff.id);
        const inPm = day.pm.includes(staff.id);
        const amRoom = day.rooms.am[staff.id] || '';
        const pmRoom = day.rooms.pm[staff.id] || '';
        return `<div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"><div class="flex items-center gap-3 w-[40%]"><div class="w-10 h-10 rounded-full ${staff.color} text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">${staff.name.charAt(0)}</div><div class="overflow-hidden"><div class="text-sm font-bold text-gray-800 truncate">${staff.name}</div><div class="text-[10px] text-gray-400 truncate">${staff.roleName}</div></div></div><div class="flex-1 flex flex-col gap-2 pl-3 border-l border-gray-100"><div class="flex items-center gap-2"><button onclick="toggleScheduleShiftClick('${staff.id}','am')" class="w-7 h-7 rounded shrink-0 text-xs font-bold transition-colors ${inAm ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}">上</button><select ${!inAm ? 'disabled' : ''} onchange="setScheduleRoomFromSelect('${staff.id}','am',this.value)" class="flex-1 w-full text-xs border border-gray-200 rounded px-1.5 py-1 focus:border-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-300 disabled:border-gray-100 transition-all">${roomOptions.replace(`value="${amRoom}"`, `value="${amRoom}" selected`)}</select></div><div class="flex items-center gap-2"><button onclick="toggleScheduleShiftClick('${staff.id}','pm')" class="w-7 h-7 rounded shrink-0 text-xs font-bold transition-colors ${inPm ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}">下</button><select ${!inPm ? 'disabled' : ''} onchange="setScheduleRoomFromSelect('${staff.id}','pm',this.value)" class="flex-1 w-full text-xs border border-gray-200 rounded px-1.5 py-1 focus:border-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-300 disabled:border-gray-100 transition-all">${roomOptions.replace(`value="${pmRoom}"`, `value="${pmRoom}" selected`)}</select></div></div></div>`;
    }).join('');
    renderScheduleTimeline('schedule-drawer-timeline-container', true);
}

function toggleScheduleShiftClick(staffId, period) {
    const isWorking = !scheduleData[currentScheduleDate][period].includes(staffId);
    toggleScheduleStaffShift(currentScheduleDate, staffId, period, isWorking);
    renderScheduleEditDrawer();
}

function setScheduleRoomFromSelect(staffId, period, roomId) {
    setScheduleStaffRoom(currentScheduleDate, staffId, period, roomId);
}

function openScheduleCapPopover(e, id, time, cap) {
    currentScheduleEditingSlot = { id, time };
    const info = document.getElementById('schedule-cap-pop-info');
    const input = document.getElementById('schedule-cap-pop-input');
    const pop = document.getElementById('schedule-capacity-popover');
    if (!info || !input || !pop) return;
    const staff = scheduleStaff.find(s => s.id === id);
    info.innerText = `${staff ? staff.name : ''} - ${time}`;
    input.value = cap;
    const rect = e.currentTarget.getBoundingClientRect();
    pop.style.top = `${Math.max(16, rect.top - 120)}px`;
    pop.style.left = `${Math.max(16, rect.left)}px`;
    pop.classList.remove('hidden');
}

function closeScheduleCapPopover() {
    const pop = document.getElementById('schedule-capacity-popover');
    if (!pop) return;
    pop.classList.add('hidden');
}

function adjustScheduleCap(delta) {
    const input = document.getElementById('schedule-cap-pop-input');
    if (!input) return;
    const next = Math.max(0, (parseInt(input.value || '0', 10) || 0) + delta);
    input.value = next;
}

function saveScheduleCapPopover() {
    const input = document.getElementById('schedule-cap-pop-input');
    if (!input || !currentScheduleEditingSlot) return;
    const { id, time } = currentScheduleEditingSlot;
    if (!scheduleData[currentScheduleDate].slots[id]) scheduleData[currentScheduleDate].slots[id] = {};
    scheduleData[currentScheduleDate].slots[id][time] = parseInt(input.value || '0', 10) || 0;
    closeScheduleCapPopover();
    renderScheduleEditDrawer();
}

function openScheduleSettings() {
	document.getElementById('set-am-start').value = scheduleSettings.amStart;
	document.getElementById('set-am-end').value = scheduleSettings.amEnd;
	document.getElementById('set-pm-start').value = scheduleSettings.pmStart;
	document.getElementById('set-pm-end').value = scheduleSettings.pmEnd;
	document.getElementById('set-duration').value = scheduleSettings.duration;
	document.getElementById('settings-staff-list').innerHTML = STAFF.filter(s => s.role === '医生' || s.role === '视光师').map(s => `
			<div class="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
			<div class="flex items-center space-x-3">
					<div class="w-8 h-8 rounded-full ${s.color} text-white flex items-center justify-center text-sm font-bold">${s.name.charAt(0)}</div>
					<div>
					<div class="text-sm font-bold text-slate-700">${s.name}</div>
					<div class="text-[10px] text-slate-400">${s.role === 'doctor' ? '医生' : '视光师'}</div>
					</div>
			</div>
			<div class="flex items-center space-x-2">
					<span class="text-xs text-slate-500">默认容量:</span>
					<input type="number" id="set-cap-${s.id}" value="${s.defaultCap}" class="w-16 text-center border border-slate-200 rounded-lg py-1 text-sm focus:outline-none focus:border-brand-500" min="0">
					<span class="text-xs text-slate-500">人/段</span>
			</div>
			</div>
	`).join('');
	document.getElementById('settings-modal').classList.remove('hidden');
}

function closeScheduleSettings() { document.getElementById('settings-modal').classList.add('hidden'); }

function saveScheduleSettings() {
	scheduleSettings.amStart = document.getElementById('set-am-start').value;
	scheduleSettings.amEnd = document.getElementById('set-am-end').value;
	scheduleSettings.pmStart = document.getElementById('set-pm-start').value;
	scheduleSettings.pmEnd = document.getElementById('set-pm-end').value;
	scheduleSettings.duration = parseInt(document.getElementById('set-duration').value);

	STAFF.forEach(s => {
			if (s.role === 'doctor' || s.role === 'optometrist') {
			const input = document.getElementById(`set-cap-${s.id}`);
			if (input) s.defaultCap = parseInt(input.value);
			}
	});
	closeScheduleSettings();
	alert('全局设置已保存！新排班将应用此规则。');
}

window.initOrderManagement = initOrderManagement;
window.selectScheduleDate = selectScheduleDate;
window.openScheduleEditDrawer = openScheduleEditDrawer;
window.closeScheduleEditDrawer = closeScheduleEditDrawer;
window.setScheduleRoleFilter = setScheduleRoleFilter;
window.toggleScheduleShiftClick = toggleScheduleShiftClick;
window.setScheduleRoomFromSelect = setScheduleRoomFromSelect;
window.openScheduleCapPopover = openScheduleCapPopover;
window.closeScheduleCapPopover = closeScheduleCapPopover;
window.adjustScheduleCap = adjustScheduleCap;
window.saveScheduleCapPopover = saveScheduleCapPopover;

window.openScheduleSettings = openScheduleSettings;
window.closeScheduleSettings = closeScheduleSettings;
window.saveScheduleSettings = saveScheduleSettings;
