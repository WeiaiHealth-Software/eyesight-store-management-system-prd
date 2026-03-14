let allRooms = [];
let currentRoomFilter = 'all';
let editingRoomNo = null;
let pendingDeleteRoomNo = null;

function getTypePreset(typeLabel) {
    if (typeLabel === '验光室') return { type: 'optometry', icon: 'ph-eyeglasses', color: 'text-primary-500', bg: 'bg-primary-50' };
    if (typeLabel === '训练室') return { type: 'training', icon: 'ph-game-controller', color: 'text-purple-500', bg: 'bg-purple-50' };
    return { type: 'consultation', icon: 'ph-stethoscope', color: 'text-blue-500', bg: 'bg-blue-50' };
}

function labelToStatus(statusLabel) {
    if (statusLabel === '维修中') return 'maintenance';
    if (statusLabel === '已废弃') return 'deprecated';
    return 'active';
}

function statusToLabel(status) {
    if (status === 'maintenance') return '维修中';
    if (status === 'deprecated') return '已废弃';
    return '启用中';
}

function getStatusMeta(status) {
    if (status === 'maintenance') return { text: '维修中', dot: 'bg-amber-500', pulse: false };
    if (status === 'deprecated') return { text: '已废弃', dot: 'bg-gray-400', pulse: false };
    return { text: '启用中', dot: 'bg-green-500', pulse: true };
}

function initRoomManagement() {
    allRooms = [
      { roomNo: '101', name: '专家门诊', func: '诊室', type: 'consultation', status: 'active', capacity: 2, desc: '配备裂隙灯、眼底镜，主任医师专用。', icon: 'ph-stethoscope', color: 'text-blue-500', bg: 'bg-blue-50' },
      { roomNo: '102', name: '普通门诊', func: '诊室', type: 'consultation', status: 'active', capacity: 1, desc: '日常复查与初诊。', icon: 'ph-stethoscope', color: 'text-indigo-500', bg: 'bg-indigo-50' },
      { roomNo: '验光室 1', name: '综合验光', func: '验光室', type: 'optometry', status: 'maintenance', capacity: 2, desc: '配备综合验光仪、电脑验光仪。', icon: 'ph-eyeglasses', color: 'text-primary-500', bg: 'bg-primary-50' },
      { roomNo: '验光室 2', name: '角塑验配', func: '验光室', type: 'optometry', status: 'active', capacity: 2, desc: '配备角膜地形图仪。', icon: 'ph-eye', color: 'text-teal-500', bg: 'bg-teal-50' },
      { roomNo: '训练室', name: '视功能训练', func: '训练室', type: 'training', status: 'deprecated', capacity: 1, desc: '配备各类弱视、调节训练设备。', icon: 'ph-game-controller', color: 'text-purple-500', bg: 'bg-purple-50' }
    ];
    filterRooms(currentRoomFilter);
}

function renderRooms(rooms) {
    const grid = document.getElementById('room-grid');
    if (!grid) return;
    grid.innerHTML = rooms.map(r => {
        const statusMeta = getStatusMeta(r.status);
        const statusNode = statusMeta.pulse
            ? `<span class="relative flex w-2.5 h-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full ${statusMeta.dot} opacity-50"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 ${statusMeta.dot}"></span></span>`
            : `<span class="inline-flex w-2.5 h-2.5 rounded-full ${statusMeta.dot}"></span>`;
        return `
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow group relative flex flex-col gap-4">
            <div class="absolute top-3 right-3 flex items-center rounded-lg bg-white/95 border border-gray-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick="openRoomDrawer('${r.roomNo}')" class="px-2.5 py-1.5 text-gray-400 hover:text-primary-600 transition"><i class="ph-bold ph-pencil-simple"></i></button>
              <span class="w-px h-4 bg-gray-200"></span>
              <button onclick="openDeleteRoomConfirm('${r.roomNo}')" class="px-2.5 py-1.5 text-red-400 hover:text-red-600 transition"><i class="ph-bold ph-trash"></i></button>
            </div>
            <div class="flex items-start gap-3 pr-10">
              <div class="w-16 h-16 rounded-xl ${r.bg} ${r.color} flex items-center justify-center text-2xl shrink-0"><i class="ph-fill ${r.icon}"></i></div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-xl font-bold text-gray-800 truncate">${r.name}</h3>
                  ${statusNode}
                </div>
                <div class="mt-2 flex items-center gap-2 flex-wrap">
                  <span class="inline-flex items-center px-2 py-1 rounded-md bg-primary-50 text-primary-600 text-xs font-bold border border-primary-100">${r.roomNo}</span>
                  <span class="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-600 text-xs font-bold border border-orange-200">${r.capacity}人</span>
                  <span class="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">${r.func}</span>
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-500 line-clamp-2">${r.desc}</p>
          </div>
        `;
    }).join('');
}

function filterRooms(type) {
    currentRoomFilter = type;
    const buttons = ['all', 'consultation', 'optometry', 'training'];
    buttons.forEach(btn => {
        const el = document.getElementById(`filter-${btn}`);
        if (!el) return;
        if (btn === type) {
            el.className = 'px-4 py-1.5 bg-primary-500 rounded-md text-sm font-semibold text-white transition-all';
        } else {
            el.className = 'px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 transition-all';
        }
    });
    if (type === 'all') {
        renderRooms(allRooms);
        return;
    }
    renderRooms(allRooms.filter(r => r.type === type));
}

function openRoomDrawer(roomNo) {
    const drawer = document.getElementById('room-drawer');
    const overlay = document.getElementById('room-drawer-overlay');
    const title = document.getElementById('room-drawer-title');
    const inputNo = document.getElementById('room-input-no');
    const inputName = document.getElementById('room-input-name');
    const inputType = document.getElementById('room-input-type');
    const inputCapacity = document.getElementById('room-input-capacity');
    const inputStatus = document.getElementById('room-input-status');
    const inputDesc = document.getElementById('room-input-desc');
    if (!drawer || !overlay || !title || !inputNo || !inputName || !inputType || !inputCapacity || !inputStatus || !inputDesc) return;

    if (roomNo) {
        const target = allRooms.find(r => r.roomNo === roomNo);
        if (target) {
            editingRoomNo = roomNo;
            title.innerHTML = '<i class="ph-duotone ph-door-open text-primary-600"></i> 编辑诊室信息';
            inputNo.value = target.roomNo;
            inputName.value = target.name;
            inputType.value = target.func;
            inputCapacity.value = target.capacity || 1;
            inputStatus.value = statusToLabel(target.status);
            inputDesc.value = target.desc || '';
        }
    } else {
        editingRoomNo = null;
        title.innerHTML = '<i class="ph-duotone ph-door-open text-primary-600"></i> 新增诊室信息';
        inputNo.value = '';
        inputName.value = '';
        inputType.value = '诊室';
        inputCapacity.value = 1;
        inputStatus.value = '启用中';
        inputDesc.value = '';
    }

    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        drawer.classList.remove('translate-x-full');
    }, 10);
}

function closeRoomDrawer() {
    const drawer = document.getElementById('room-drawer');
    const overlay = document.getElementById('room-drawer-overlay');
    if (!drawer || !overlay) return;
    drawer.classList.add('translate-x-full');
    overlay.classList.add('opacity-0');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 300);
}

function saveRoom() {
    const inputNo = document.getElementById('room-input-no');
    const inputName = document.getElementById('room-input-name');
    const inputType = document.getElementById('room-input-type');
    const inputCapacity = document.getElementById('room-input-capacity');
    const inputStatus = document.getElementById('room-input-status');
    const inputDesc = document.getElementById('room-input-desc');
    if (!inputNo || !inputName || !inputType || !inputCapacity || !inputStatus || !inputDesc) return;

    const roomNo = inputNo.value.trim();
    const name = inputName.value.trim();
    if (!roomNo || !name) return;

    const preset = getTypePreset(inputType.value);
    const payload = {
        roomNo,
        name,
        func: inputType.value,
        type: preset.type,
        status: labelToStatus(inputStatus.value),
        capacity: Math.max(1, Number(inputCapacity.value) || 1),
        desc: inputDesc.value.trim(),
        icon: preset.icon,
        color: preset.color,
        bg: preset.bg
    };

    if (editingRoomNo) {
        const idx = allRooms.findIndex(r => r.roomNo === editingRoomNo);
        if (idx > -1) {
            allRooms[idx] = payload;
        }
    } else {
        allRooms.unshift(payload);
    }

    closeRoomDrawer();
    filterRooms(currentRoomFilter);
}

function openDeleteRoomConfirm(roomNo) {
    const modal = document.getElementById('room-delete-modal');
    const text = document.getElementById('room-delete-text');
    if (!modal || !text) return;
    pendingDeleteRoomNo = roomNo;
    text.innerText = `确认删除 ${roomNo} 吗？删除后无法恢复。`;
    modal.classList.remove('hidden');
}

function closeDeleteRoomConfirm() {
    const modal = document.getElementById('room-delete-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    pendingDeleteRoomNo = null;
}

function confirmDeleteRoom() {
    if (!pendingDeleteRoomNo) return;
    allRooms = allRooms.filter(r => r.roomNo !== pendingDeleteRoomNo);
    closeDeleteRoomConfirm();
    filterRooms(currentRoomFilter);
}

window.initRoomManagement = initRoomManagement;
window.openRoomDrawer = openRoomDrawer;
window.closeRoomDrawer = closeRoomDrawer;
window.filterRooms = filterRooms;
window.saveRoom = saveRoom;
window.openDeleteRoomConfirm = openDeleteRoomConfirm;
window.closeDeleteRoomConfirm = closeDeleteRoomConfirm;
window.confirmDeleteRoom = confirmDeleteRoom;
