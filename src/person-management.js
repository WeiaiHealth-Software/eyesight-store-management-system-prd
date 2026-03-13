function initPersonManagement() {
    const mockData = [
      { name: '李主任', age: 45, role: '医生', title: '副主任医师', desc: '小儿斜弱视、近视防控', status: 'active', joinDate: '2018-05-12', color: 'bg-blue-500' },
      { name: '张视光', age: 28, role: '视光师', title: '高级验光员', desc: '角膜塑形镜验配、双眼视功能异常处理', status: 'active', joinDate: '2021-03-01', color: 'bg-emerald-500' },
      { name: '王视训', age: 26, role: '视训师', title: '初级视训师', desc: '弱视训练、调节功能训练', status: 'active', joinDate: '2022-07-15', color: 'bg-teal-500' },
      { name: '赵前台', age: 24, role: '前台', title: '接待专员', desc: '客户接待、分诊引导', status: 'resigned', joinDate: '2020-01-10', resignDate: '2023-09-01', color: 'bg-amber-500' }
    ];

    const tableBody = document.getElementById('person-table-body');
    if (tableBody) {
        tableBody.innerHTML = mockData.map(s => `
          <tr class="hover:bg-slate-50 transition-colors group">
            <td class="py-3 px-6">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full ${s.color} text-white flex items-center justify-center font-bold shadow-sm">${s.name.charAt(0)}</div>
                <div><div class="font-bold text-slate-800 text-sm">${s.name} <span class="text-xs font-normal text-slate-400 ml-1">${s.age}岁</span></div></div>
              </div>
            </td>
            <td class="py-3 px-6"><div class="text-sm font-bold text-slate-700">${s.role}</div><div class="text-xs text-slate-500">${s.title}</div></td>
            <td class="py-3 px-6"><div class="text-sm text-slate-600 max-w-xs truncate" title="${s.desc}">${s.desc}</div></td>
            <td class="py-3 px-6">
              ${s.status === 'active' 
                ? `<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">在职</span><div class="text-xs text-slate-400 mt-1">入职: ${s.joinDate}</div>` 
                : `<span class="px-2 py-1 bg-slate-200 text-slate-500 rounded text-xs font-bold">已离职</span><div class="text-xs text-slate-400 mt-1">离职: ${s.resignDate}</div>`}
            </td>
            <td class="py-3 px-6 text-right">
              <button class="text-primary-500 text-primary-700 text-sm font-medium mr-3">编辑</button>
            </td>
          </tr>
        `).join('');
    }
}

function openPersonModal() { document.getElementById('personnel-modal').classList.remove('hidden'); }
function closePersonModal() { document.getElementById('personnel-modal').classList.add('hidden'); }

// Expose to window so onclick works
window.openPersonModal = openPersonModal;
window.closePersonModal = closePersonModal;
window.initPersonManagement = initPersonManagement;
