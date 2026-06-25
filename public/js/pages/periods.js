window.PeriodsPage = (function() {
  let periodLogs = [];
  let currentDate = new Date();
  
  function render() {
    const t = I18n.t.bind(I18n);
    return `
      <div class="page tracker-page animate-fade-in">
        <div class="glass-card mb-4" style="text-align: center; position: relative;">
          <h2 class="text-xl font-bold">${t('periods.title')}</h2>
        </div>

        <div class="glass-card animate-slide-up stagger-1">
          <div class="calendar-header">
            <button class="calendar-nav-btn" id="cal-prev">❮</button>
            <div class="calendar-month-year" id="cal-month-year"></div>
            <button class="calendar-nav-btn" id="cal-next">❯</button>
          </div>

          <div class="calendar-grid mb-2">
            <div class="calendar-day-header">${t('periods.sun')}</div>
            <div class="calendar-day-header">${t('periods.mon')}</div>
            <div class="calendar-day-header">${t('periods.tue')}</div>
            <div class="calendar-day-header">${t('periods.wed')}</div>
            <div class="calendar-day-header">${t('periods.thu')}</div>
            <div class="calendar-day-header">${t('periods.fri')}</div>
            <div class="calendar-day-header">${t('periods.sat')}</div>
          </div>
          <div class="calendar-grid" id="cal-days"></div>
        </div>
        
        <!-- Legend -->
        <div class="glass-card mt-4 animate-slide-up stagger-2" style="display:flex; justify-content:space-around; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:16px; height:16px; border-radius:50%; background:#fca5a5;"></div>
            <span class="text-xs">${t('periods.flowLight')}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:16px; height:16px; border-radius:50%; background:#ef4444;"></div>
            <span class="text-xs">${t('periods.flowNormal')}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:16px; height:16px; border-radius:50%; background:#991b1b;"></div>
            <span class="text-xs">${t('periods.flowHeavy')}</span>
          </div>
        </div>
      </div>

      <!-- Flow Selection Modal -->
      <div class="modal-overlay" id="flow-modal">
        <div class="modal-content" style="position:relative;">
          <button class="modal-close" id="flow-close">&times;</button>
          <div class="modal-title">${t('periods.selectFlow')}</div>
          <div class="text-center mb-4 text-secondary text-sm" id="flow-date-display"></div>
          
          <div class="flex flex-col gap-3">
            <button class="btn btn-outline" style="background:#fca5a5; color:#7f1d1d; border:none;" data-flow="light">${t('periods.flowLight')}</button>
            <button class="btn btn-outline" style="background:#ef4444; color:#fff; border:none;" data-flow="normal">${t('periods.flowNormal')}</button>
            <button class="btn btn-outline" style="background:#991b1b; color:#fff; border:none;" data-flow="heavy">${t('periods.flowHeavy')}</button>
            <button class="btn btn-outline" style="margin-top:var(--space-2); display:none;" id="flow-remove-btn">${t('periods.unmarkPeriod')}</button>
          </div>
        </div>
      </div>
    `;
  }

  async function mount() {
    // Reset to current month
    currentDate = new Date();
    
    try {
      periodLogs = await API.periods.get();
    } catch (e) {
      console.error(e);
      periodLogs = [];
    }

    renderCalendar();

    // Nav buttons
    document.getElementById('cal-prev').addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });
    
    document.getElementById('cal-next').addEventListener('click', () => {
      // Don't allow navigating into the future
      const today = new Date();
      if (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth()) return;
      
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });

    // Modal close
    document.getElementById('flow-close').addEventListener('click', closeModal);
    document.getElementById('flow-modal').addEventListener('click', (e) => {
      if (e.target.id === 'flow-modal') closeModal();
    });
  }

  function renderCalendar() {
    const t = I18n.t.bind(I18n);
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const today = new Date();

    // Update Header
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    document.getElementById('cal-month-year').textContent = `${t('periods.' + months[month])} ${year}`;

    // Disable Next if current month
    const nextBtn = document.getElementById('cal-next');
    if (year === today.getFullYear() && month === today.getMonth()) {
      nextBtn.disabled = true;
    } else {
      nextBtn.disabled = false;
    }

    // Disable Prev if older than 12 months
    const prevBtn = document.getElementById('cal-prev');
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(today.getMonth() - 11);
    if (year < twelveMonthsAgo.getFullYear() || (year === twelveMonthsAgo.getFullYear() && month <= twelveMonthsAgo.getMonth())) {
      prevBtn.disabled = true;
    } else {
      prevBtn.disabled = false;
    }

    // Days Grid
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysContainer = document.getElementById('cal-days');
    daysContainer.innerHTML = '';

    // Empty slots before 1st
    for (let i = 0; i < firstDay; i++) {
      daysContainer.innerHTML += `<div class="calendar-day empty"></div>`;
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const log = periodLogs.find(l => l.date === dateStr);
      
      let classes = 'calendar-day';
      if (dateStr === Helpers.getToday()) classes += ' today';
      
      if (log) {
        classes += ` marked-${log.flow}`;
      }

      // Don't allow clicking future dates
      const cellDate = new Date(year, month, i);
      const isFuture = cellDate > today;

      const div = document.createElement('div');
      div.className = classes;
      if (isFuture) {
        div.style.opacity = '0.3';
        div.style.cursor = 'default';
      } else {
        div.onclick = () => openFlowModal(dateStr, log);
      }
      div.textContent = i;
      daysContainer.appendChild(div);
    }
  }

  let selectedDateStr = null;

  function openFlowModal(dateStr, existingLog) {
    selectedDateStr = dateStr;
    const modal = document.getElementById('flow-modal');
    const dateDisplay = document.getElementById('flow-date-display');
    const removeBtn = document.getElementById('flow-remove-btn');
    
    dateDisplay.textContent = Helpers.formatDate(dateStr, I18n.getLang());
    
    if (existingLog) {
      removeBtn.style.display = 'block';
    } else {
      removeBtn.style.display = 'none';
    }

    // Attach handlers cleanly
    document.querySelectorAll('[data-flow]').forEach(btn => {
      btn.onclick = () => saveFlow(btn.dataset.flow);
    });
    
    removeBtn.onclick = removeFlow;

    modal.classList.add('active');
  }

  function closeModal() {
    document.getElementById('flow-modal').classList.remove('active');
    selectedDateStr = null;
  }

  async function saveFlow(flow) {
    if (!selectedDateStr) return;
    try {
      await API.periods.log(selectedDateStr, flow);
      
      // Update local state
      const existingIdx = periodLogs.findIndex(l => l.date === selectedDateStr);
      if (existingIdx >= 0) {
        periodLogs[existingIdx].flow = flow;
      } else {
        periodLogs.push({ date: selectedDateStr, flow });
      }
      
      Helpers.showToast(I18n.t('common.success'), 'success');
      renderCalendar();
      closeModal();
    } catch (e) {
      console.error(e);
    }
  }

  async function removeFlow() {
    if (!selectedDateStr) return;
    try {
      await API.periods.remove(selectedDateStr);
      
      // Update local state
      periodLogs = periodLogs.filter(l => l.date !== selectedDateStr);
      
      Helpers.showToast(I18n.t('common.delete'), 'info');
      renderCalendar();
      closeModal();
    } catch (e) {
      console.error(e);
    }
  }

  function unmount() {
    periodLogs = [];
  }

  return { render, mount, unmount };
})();
