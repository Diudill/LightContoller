const appState = {
  components: [],

  connections: [],

  connectionState: {
    isConnecting: false,
    startComponent: null,
    startPoint: null
  },

  draggedComponent: null,
  dragOffset: { x: 0, y: 0 },

  timers: {}
};
window.appState = appState;

let drawingArea, componentPalette;

window.toggleLight = toggleLight;
window.toggleSwitch = toggleSwitch;
window.handleMouseDown = handleMouseDown;
window.handleMouseMove = handleMouseMove;
window.handleMouseUp = handleMouseUp;
window.initializeEventListeners = initializeEventListeners;
window.updateConnections = updateConnections;

function logStatus(message) {
  const statusLog = document.getElementById('status-log');
  if (statusLog) {
    const logEntry = document.createElement('div');
    logEntry.textContent = new Date().toLocaleTimeString() + ': ' + message;
    statusLog.appendChild(logEntry);

    if (statusLog.children.length > 10) {
      statusLog.removeChild(statusLog.children[0]);
    }
  }
  console.log(message);
}

document.addEventListener('DOMContentLoaded', function() {
  logStatus('DOM加载完成，初始化应用');

  drawingArea = document.getElementById('drawing-area');
  componentPalette = document.querySelector('.component-palette');

  initializeEventListeners();
  initializePaletteEvents();

  logStatus('系统已准备就绪 - 拖入组件并用连接点连接它们');
  logStatus('提示：当所有输入连接都开启时，灯才会亮起(串联逻辑)');
});

function initializePaletteEvents() {
  const paletteItems = componentPalette.querySelectorAll('.palette-item');

  paletteItems.forEach(item => {
    item.addEventListener('mousedown', handlePaletteDragStart);
    console.log('Added drag event to palette item:', item.getAttribute('data-type'));
  });
}

function handlePaletteDragStart(e) {
  console.log('Palette drag start for type:', this.getAttribute('data-type'));
  const type = this.getAttribute('data-type');

  // 移动的时候
  const ghostElement = document.createElement('div');
  ghostElement.className = 'component';
  ghostElement.style.position = 'absolute';
  ghostElement.style.opacity = '0.7';
  ghostElement.style.pointerEvents = 'none';
  ghostElement.style.zIndex = '1000';

  if (type === 'light') {
    ghostElement.innerHTML = '<div class="light-bulb"></div><div>智能灯</div>';
    ghostElement.classList.add('light-component');
  } else if (type === 'switch') {
    ghostElement.innerHTML = '<div class="switch-toggle"></div><div>开关</div>';
    ghostElement.classList.add('switch-component');
  } else if (type === 'button') {
    ghostElement.innerHTML = '<div class="push-button">按下</div><div>按钮</div>';
    ghostElement.classList.add('button-component');
  }

  document.body.appendChild(ghostElement);

  // 相对于组件的偏移
  const offsetX = e.clientX - this.getBoundingClientRect().left;
  const offsetY = e.clientY - this.getBoundingClientRect().top;
  ghostElement.style.left = (e.clientX - offsetX) + 'px';
  ghostElement.style.top = (e.clientY - offsetY) + 'px';

  document.body.style.cursor = 'grabbing';

  document.onmousemove = function(moveEvent) {
    ghostElement.style.left = (moveEvent.clientX - offsetX) + 'px';
    ghostElement.style.top = (moveEvent.clientY - offsetY) + 'px';
  };

  document.onmouseup = function(upEvent) {
    document.body.removeChild(ghostElement);
    document.onmousemove = null;
    document.onmouseup = null;
    document.body.style.cursor = '';

    const drawingRect = drawingArea.getBoundingClientRect();
    if (
      upEvent.clientX >= drawingRect.left && upEvent.clientX <= drawingRect.right &&
      upEvent.clientY >= drawingRect.top && upEvent.clientY <= drawingRect.bottom
    ) {
      console.log('Drop in drawing area');
      const x = upEvent.clientX - drawingRect.left - offsetX;
      const y = upEvent.clientY - drawingRect.top - offsetY;

      if (type === 'light') {
        addNewLight(x, y);
      } else if (type === 'switch') {
        addNewSwitch(x, y);
      } else if (type === 'button') {
        addNewButton(x, y);
      }
    } else {
      console.log('Drop outside drawing area');
    }
  };

  e.preventDefault();
}

function addNewLight(x = 150, y = 150) {
  const lightComponent = {
    id: 'light-' + Date.now(),
    type: 'light',
    name: '智能灯',
    is_on: false,
    properties: {
      color: '#f1c40f',
      brightness: 100,
      position_x: x,
      position_y: y
    },
    connections: {
      input: true,
      output: false
    }
  };

  appState.components.push(lightComponent);
  renderComponent(lightComponent);

  logStatus('新灯组件已添加');
}

function addNewSwitch(x = 150, y = 150) {
  const switchComponent = {
    id: 'switch-' + Date.now(),
    type: 'switch',
    name: '开关',
    is_on: false,
    properties: {
      position_x: x,
      position_y: y
    },
    connections: {
      input: false,
      output: true
    }
  };

  appState.components.push(switchComponent);
  renderComponent(switchComponent);

  logStatus('新开关组件已添加');
}

function addNewButton(x = 150, y = 150) {
  const buttonComponent = {
    id: 'button-' + Date.now(),
    type: 'button',
    name: '按钮',
    is_on: false,
    is_pressed: false,
    properties: {
      position_x: x,
      position_y: y
    },
    connections: {
      input: false,
      output: true
    }
  };

  appState.components.push(buttonComponent);
  renderComponent(buttonComponent);

  logStatus('新按钮组件已添加');
}

function renderComponent(component) {
  let componentElement;

  const existingComponent = document.getElementById(component.id);
  if (existingComponent) {
    componentElement = existingComponent;
    console.log('Updating existing component', component.id);
    componentElement.innerHTML = '';
  } else {
    console.log('Creating new component element', component.id);
    componentElement = document.createElement('div');
    componentElement.id = component.id;
    componentElement.className = 'component';

    if (component.type === 'light') {
      componentElement.classList.add('light-component');
    } else if (component.type === 'switch') {
      componentElement.classList.add('switch-component');
    } else if (component.type === 'button') {
      componentElement.classList.add('button-component');
    }

    componentElement.setAttribute('data-type', component.type);
    componentElement.style.position = 'absolute';
    drawingArea.appendChild(componentElement);
  }

  componentElement.style.left = component.properties.position_x + 'px';
  componentElement.style.top = component.properties.position_y + 'px';

  switch (component.type) {
    case 'light':
      renderLightComponent(component, componentElement);
      break;
    case 'switch':
      renderSwitchComponent(component, componentElement);
      break;
    case 'button':
      renderButtonComponent(component, componentElement);
      break;
  }

  componentElement.addEventListener('dblclick', function() {
    openComponentConfigForId(component.id);
  });
}

function renderLightComponent(component, element) {
  const lightBulb = document.createElement('div');
  lightBulb.className = 'light-bulb';
  if (component.is_on) {
    lightBulb.classList.add('on');
    lightBulb.style.backgroundColor = component.properties.color;
    lightBulb.style.boxShadow = `0 0 ${component.properties.brightness * 0.2}px ${component.properties.color}`;
  }

  const label = document.createElement('div');
  label.className = 'component-label';
  label.textContent = component.name;

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn btn-primary toggle-light';
  toggleBtn.textContent = component.is_on ? '关闭' : '打开';
  toggleBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    console.log('Toggle button clicked for component', component.id);
    toggleLight(component.id);
  });

  element.appendChild(lightBulb);
  element.appendChild(label);
  element.appendChild(toggleBtn);

  if (component.connections && component.connections.input) {
    const inputPoint = document.createElement('div');
    inputPoint.className = 'connection-point input-point';
    inputPoint.setAttribute('data-point-type', 'input');
    inputPoint.style.left = '-6px';
    inputPoint.style.top = '50%';
    inputPoint.style.transform = 'translateY(-50%)';

    inputPoint.addEventListener('mousedown', function(e) {
      e.stopPropagation();
      handleConnectionPointClick(component.id, 'input', e);
    });

    element.appendChild(inputPoint);
  }
}

function renderSwitchComponent(component, element) {
  const switchToggle = document.createElement('div');
  switchToggle.className = 'switch-toggle';
  if (component.is_on) {
    switchToggle.classList.add('on');
  }

  const label = document.createElement('div');
  label.className = 'component-label';
  label.textContent = component.name;

  switchToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleSwitch(component.id);
  });

  element.appendChild(switchToggle);
  element.appendChild(label);

  if (component.connections && component.connections.output) {
    const outputPoint = document.createElement('div');
    outputPoint.className = 'connection-point output-point';
    outputPoint.setAttribute('data-point-type', 'output');
    outputPoint.style.right = '-6px';
    outputPoint.style.top = '50%';
    outputPoint.style.transform = 'translateY(-50%)';

    outputPoint.addEventListener('mousedown', function(e) {
      e.stopPropagation();
      handleConnectionPointClick(component.id, 'output', e);
    });

    element.appendChild(outputPoint);
  }
}

function renderButtonComponent(component, element) {
  const pushButton = document.createElement('div');
  pushButton.className = 'push-button';
  pushButton.textContent = '按下';

  const label = document.createElement('div');
  label.className = 'component-label';
  label.textContent = component.name;

  pushButton.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    pushButton.style.transform = 'translateY(2px)';
    pushButton.style.boxShadow = '0 0 2px rgba(0,0,0,0.2)';
    pushButton.style.background = 'linear-gradient(to bottom, #e0e0e0, #d0d0d0)';
    pushButtonDown(component.id);
  });

  pushButton.addEventListener('mouseup', function(e) {
    e.stopPropagation();
    pushButton.style.transform = '';
    pushButton.style.boxShadow = '';
    pushButton.style.background = '';
    pushButtonUp(component.id);
  });

  pushButton.addEventListener('mouseleave', function() {
    if (component.is_pressed) {
      pushButton.style.transform = '';
      pushButton.style.boxShadow = '';
      pushButton.style.background = '';
      pushButtonUp(component.id);
    }
  });

  element.appendChild(pushButton);
  element.appendChild(label);

  if (component.connections && component.connections.output) {
    const outputPoint = document.createElement('div');
    outputPoint.className = 'connection-point output-point';
    outputPoint.setAttribute('data-point-type', 'output');
    outputPoint.style.right = '-6px';
    outputPoint.style.top = '50%';
    outputPoint.style.transform = 'translateY(-50%)';

    outputPoint.addEventListener('mousedown', function(e) {
      e.stopPropagation();
      handleConnectionPointClick(component.id, 'output', e);
    });

    element.appendChild(outputPoint);
  }
}

function handleConnectionPointClick(componentId, pointType, event) {
  event.stopPropagation();

  if (!appState.connectionState.isConnecting) {
    appState.connectionState.isConnecting = true;
    appState.connectionState.startComponent = componentId;
    appState.connectionState.startPoint = pointType;

    const tempLine = document.createElement('div');
    tempLine.id = 'temp-connection-line';
    tempLine.className = 'connection-line';
    drawingArea.appendChild(tempLine);

    const startElement = document.getElementById(componentId);
    const startPoint = startElement.querySelector(`.${pointType}-point`);
    const startRect = startPoint.getBoundingClientRect();
    const drawingRect = drawingArea.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2 - drawingRect.left;
    const startY = startRect.top + startRect.height / 2 - drawingRect.top;

    tempLine.setAttribute('data-start-x', String(startX));
    tempLine.setAttribute('data-start-y', String(startY));

    tempLine.style.left = startX + 'px';
    tempLine.style.top = startY + 'px';

    document.addEventListener('mousemove', updateTempConnectionLine);
    document.addEventListener('mouseup', finishConnection);

    logStatus('开始创建连接');
  }
}

function updateTempConnectionLine(e) {
  const tempLine = document.getElementById('temp-connection-line');
  if (!tempLine) return;

  const drawingRect = drawingArea.getBoundingClientRect();
  const startX = parseFloat(tempLine.getAttribute('data-start-x'));
  const startY = parseFloat(tempLine.getAttribute('data-start-y'));

  const endX = e.clientX - drawingRect.left;
  const endY = e.clientY - drawingRect.top;

  const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
  const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

  tempLine.style.width = length + 'px';
  tempLine.style.transform = `rotate(${angle}deg)`;
}

function finishConnection(e) {
  document.removeEventListener('mousemove', updateTempConnectionLine);
  document.removeEventListener('mouseup', finishConnection);

  const tempLine = document.getElementById('temp-connection-line');
  if (!tempLine) return;

  const elements = document.elementsFromPoint(e.clientX, e.clientY);
  let targetPoint = null;
  let targetComponent = null;

  for (const el of elements) {
    if (el.classList.contains('connection-point')) {
      const pointType = el.getAttribute('data-point-type');

      let parentEl = el.parentElement;
      while (parentEl && !parentEl.classList.contains('component')) {
        parentEl = parentEl.parentElement;
      }

      if (parentEl) {
        targetPoint = pointType;
        targetComponent = parentEl.id;
        break;
      }
    }
  }

  tempLine.remove();

  if (
    targetPoint &&
    targetComponent &&
    targetComponent !== appState.connectionState.startComponent &&
    ((appState.connectionState.startPoint === 'output' && targetPoint === 'input') ||
      (appState.connectionState.startPoint === 'input' && targetPoint === 'output'))
  ) {
    const connection = {
      id: 'conn-' + Date.now(),
      source: appState.connectionState.startPoint === 'output' ?
        appState.connectionState.startComponent : targetComponent,
      target: appState.connectionState.startPoint === 'input' ?
        appState.connectionState.startComponent : targetComponent
    };

    const connectionExists = appState.connections.some(conn =>
      (conn.source === connection.source && conn.target === connection.target) ||
      (conn.source === connection.target && conn.target === connection.source)
    );

    if (!connectionExists) {
      appState.connections.push(connection);
      renderConnection(connection);
      logStatus('连接已创建');

      updateEntireCircuit();
    } else {
      logStatus('连接已存在，未创建重复连接');
    }
  } else {
    logStatus('无效连接点，连接已取消');
  }

  appState.connectionState.isConnecting = false;
  appState.connectionState.startComponent = null;
  appState.connectionState.startPoint = null;
}

function renderConnection(connection) {
  const sourceComponent = document.getElementById(connection.source);
  const targetComponent = document.getElementById(connection.target);

  if (!sourceComponent || !targetComponent) {
    console.error('Cannot render connection: components not found');
    return;
  }

  const outputPoint = sourceComponent.querySelector('.output-point');
  const inputPoint = targetComponent.querySelector('.input-point');

  if (!outputPoint || !inputPoint) {
    console.error('Cannot render connection: connection points not found');
    return;
  }

  const drawingRect = drawingArea.getBoundingClientRect();
  const outputRect = outputPoint.getBoundingClientRect();
  const inputRect = inputPoint.getBoundingClientRect();

  const startX = outputRect.left + outputRect.width / 2 - drawingRect.left;
  const startY = outputRect.top + outputRect.height / 2 - drawingRect.top;
  const endX = inputRect.left + inputRect.width / 2 - drawingRect.left;
  const endY = inputRect.top + inputRect.height / 2 - drawingRect.top;

  const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
  const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

  const connectionLine = document.createElement('div');
  connectionLine.id = connection.id;
  connectionLine.className = 'connection-line';
  connectionLine.setAttribute('data-source', connection.source);
  connectionLine.setAttribute('data-target', connection.target);
  connectionLine.setAttribute('data-start-x', String(startX));
  connectionLine.setAttribute('data-start-y', String(startY));
  connectionLine.setAttribute('data-end-x', String(endX));
  connectionLine.setAttribute('data-end-y', String(endY));

  connectionLine.style.left = startX + 'px';
  connectionLine.style.top = startY + 'px';
  connectionLine.style.width = length + 'px';
  connectionLine.style.transform = `rotate(${angle}deg)`;

  // 删除线
  connectionLine.addEventListener('contextmenu', function(e) {
    e.preventDefault(); // 阻止默认的右键菜单
    console.log('右键点击了连接线 ID:', connectionLine.id); // 打印连接线 ID 到控制台
    const confirmDelete = window.confirm('确定要删除此连接吗？');
    if (confirmDelete) {
      connectionLine.remove();
      appState.connections = appState.connections.filter(c => c.id !== connectionLine.id);

      updateEntireCircuit();
      logStatus('连接线已删除');
    }
  });

  drawingArea.appendChild(connectionLine);
}

function updateConnections() {
  appState.connections.forEach(connection => {
    const connectionLine = document.getElementById(connection.id);
    if (!connectionLine) return;

    const sourceComponent = document.getElementById(connection.source);
    const targetComponent = document.getElementById(connection.target);

    if (!sourceComponent || !targetComponent) return;

    const outputPoint = sourceComponent.querySelector('.output-point');
    const inputPoint = targetComponent.querySelector('.input-point');

    if (!outputPoint || !inputPoint) return;

    const drawingRect = drawingArea.getBoundingClientRect();
    const outputRect = outputPoint.getBoundingClientRect();
    const inputRect = inputPoint.getBoundingClientRect();

    const startX = outputRect.left + outputRect.width / 2 - drawingRect.left;
    const startY = outputRect.top + outputRect.height / 2 - drawingRect.top;
    const endX = inputRect.left + inputRect.width / 2 - drawingRect.left;
    const endY = inputRect.top + inputRect.height / 2 - drawingRect.top;

    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

    connectionLine.style.left = startX + 'px';
    connectionLine.style.top = startY + 'px';
    connectionLine.style.width = length + 'px';
    connectionLine.style.transform = `rotate(${angle}deg)`;
  });
}

function toggleSwitch(id) {
  const component = appState.components.find(c => c.id === id);
  if (!component || component.type !== 'switch') return;

  component.is_on = !component.is_on;

  const switchElement = document.getElementById(id);
  if (switchElement) {
    const switchToggle = switchElement.querySelector('.switch-toggle');
    if (switchToggle) {
      if (component.is_on) {
        switchToggle.classList.add('on');
      } else {
        switchToggle.classList.remove('on');
      }
    }
  }

  updateEntireCircuit();

  logStatus(`开关 ${component.name} 状态已切换: ${component.is_on ? '开' : '关'}`);
}

function updateConnectedLights(switchId, isOn) {
  const connections = appState.connections.filter(conn => conn.source === switchId);

  connections.forEach(conn => {
    const targetComponent = appState.components.find(c => c.id === conn.target);
    if (targetComponent && targetComponent.type === 'light') {
      const connectedSwitches = appState.connections
        .filter(c => c.target === targetComponent.id)
        .map(c => appState.components.find(comp => comp.id === c.source))
        .filter(s => s && s.type === 'switch');

      const allSwitchesOn = connectedSwitches.every(s => s.is_on);

      if (targetComponent.is_on !== allSwitchesOn) {
        toggleLight(targetComponent.id, allSwitchesOn);
      }
    } else if (targetComponent && (targetComponent.type === 'wire' || targetComponent.type === 'junction')) {
      targetComponent.is_on = isOn;
      updateConnectedLights(targetComponent.id, isOn);
    }
  });
}

function toggleLight(id, forcedState) {
  console.log('Toggling light state for:', id, forcedState);
  const component = appState.components.find(c => c.id === id);
  if (!component || component.type !== 'light') {
    console.error('Component not found or not a light:', id);
    return;
  }

  component.is_on = forcedState !== undefined ? forcedState : !component.is_on;

  const lightElement = document.getElementById(id);
  if (lightElement) {
    const lightBulb = lightElement.querySelector('.light-bulb');
    const toggleBtn = lightElement.querySelector('.toggle-light');

    if (lightBulb) {
      if (component.is_on) {
        lightBulb.classList.add('on');
        lightBulb.style.backgroundColor = component.properties.color;
        lightBulb.style.boxShadow = `0 0 ${component.properties.brightness * 0.2}px ${component.properties.color}`;
      } else {
        lightBulb.classList.remove('on');
        lightBulb.style.backgroundColor = '';
        lightBulb.style.boxShadow = '';
      }
    }

    if (toggleBtn) {
      toggleBtn.textContent = component.is_on ? '关闭' : '打开';
    }
  }

  logStatus(`灯 ${component.name} 状态已切换: ${component.is_on ? '开' : '关'}`);
}

function initializeEventListeners() {
  console.log('Setting up event listeners...');

  drawingArea.removeEventListener('mousedown', handleMouseDown);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);

  drawingArea.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(modal.id));
    }

    const saveBtn = modal.querySelector('.save-config');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => saveComponentConfig(modal.id));
    }
  });

  // 组件管理点击
  document.getElementById('manageComponentBtnId').addEventListener('click', function() {
    displayAllComponents();
  });

  // 组件管理关闭
  document.querySelector('.component-list-close').addEventListener('click', function() {
    document.getElementById('switch-list-container').style.display = 'none';
  });
}

function handleMouseDown(e) {
  if (appState.connectionState.isConnecting) return;

  let el = e.target;
  while (el && el !== drawingArea) {
    if (el.classList.contains('component')) {
      if (e.target.classList.contains('connection-point') ||
        e.target.tagName === 'BUTTON' ||
        e.target.classList.contains('switch-toggle') ||
        e.target.classList.contains('push-button') ||
        e.target.classList.contains('light-bulb')) {
        return;
      }

      console.log('开始拖动组件:', el.id);
      appState.draggedComponent = el.id;

      const rect = el.getBoundingClientRect();

      appState.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      el.style.zIndex = '100';
      el.style.cursor = 'grabbing';
      e.preventDefault();

      break;
    }
    el = el.parentElement;
  }
}

function handleMouseMove(e) {
  if (appState.connectionState.isConnecting) return;

  if (appState.draggedComponent) {
    const componentEl = document.getElementById(appState.draggedComponent);
    if (!componentEl) return;

    const drawingRect = drawingArea.getBoundingClientRect();

    let left = e.clientX - drawingRect.left - appState.dragOffset.x;
    let top = e.clientY - drawingRect.top - appState.dragOffset.y;

    left = Math.max(0, Math.min(left, drawingRect.width - componentEl.offsetWidth));
    top = Math.max(0, Math.min(top, drawingRect.height - componentEl.offsetHeight));

    componentEl.style.left = left + 'px';
    componentEl.style.top = top + 'px';

    const component = appState.components.find(c => c.id === appState.draggedComponent);
    if (component) {
      component.properties.position_x = left;
      component.properties.position_y = top;
    }

    updateConnections();
  }
}

function handleMouseUp() {
  if (appState.connectionState.isConnecting) return;

  if (appState.draggedComponent) {
    const componentEl = document.getElementById(appState.draggedComponent);
    if (componentEl) {
      componentEl.style.zIndex = '1';
      componentEl.style.cursor = '';

      console.log('组件拖动结束:', appState.draggedComponent);

      const component = appState.components.find(c => c.id === appState.draggedComponent);
      if (component) {
        logStatus(`组件 "${component.name}" 移动到新位置`);
      }
    }

    appState.draggedComponent = null;
  }
}

function openComponentConfigForId(componentId) {
  const component = appState.components.find(c => c.id === componentId);
  if (!component) return;

  const modal = document.getElementById('component-config-modal');
  if (!modal) return;

  const colorGroup = modal.querySelector('.config-color-group');
  const brightnessGroup = modal.querySelector('.config-brightness-group');
  const intervalGroup = modal.querySelector('.config-interval-group');
  const valueGroup = modal.querySelector('.config-value-group');
  const wireColorGroup = modal.querySelector('.config-wire-color-group');

  if (colorGroup) colorGroup.style.display = 'none';
  if (brightnessGroup) brightnessGroup.style.display = 'none';
  if (intervalGroup) intervalGroup.style.display = 'none';
  if (valueGroup) valueGroup.style.display = 'none';
  if (wireColorGroup) wireColorGroup.style.display = 'none';

  switch (component.type) {
    case 'light':
      if (colorGroup) colorGroup.style.display = 'block';
      if (brightnessGroup) brightnessGroup.style.display = 'block';
      break;

    case 'timer':
      if (intervalGroup) intervalGroup.style.display = 'block';
      break;

    case 'sensor':
      if (valueGroup) valueGroup.style.display = 'block';
      break;

    case 'wire':
    case 'junction':
      if (wireColorGroup) wireColorGroup.style.display = 'block';
      break;
  }

  const nameInput = document.getElementById('config-name');
  const colorInput = document.getElementById('config-color');
  const brightnessInput = document.getElementById('config-brightness');
  const intervalInput = document.getElementById('config-interval');
  const valueInput = document.getElementById('config-value');
  const wireColorInput = document.getElementById('config-wire-color');
  const colorPreview = document.querySelector('.color-preview');
  const wireColorPreview = document.querySelector('.wire-color-preview');

  if (nameInput) nameInput.value = component.name;

  switch (component.type) {
    case 'light':
      if (colorInput) colorInput.value = component.properties.color;
      if (brightnessInput) brightnessInput.value = component.properties.brightness;
      if (colorPreview) colorPreview.style.backgroundColor = component.properties.color;
      break;

    case 'timer':
      if (intervalInput) intervalInput.value = component.properties.interval;
      break;

    case 'sensor':
      if (valueInput) valueInput.value = component.value || component.properties.default_value || 0;
      break;

    case 'wire':
    case 'junction':
      if (wireColorInput) wireColorInput.value = component.properties.color;
      if (wireColorPreview) wireColorPreview.style.backgroundColor = component.properties.color;
      break;
  }

  modal.setAttribute('data-component-id', componentId);

  openModal('component-config-modal');
}

function saveComponentConfig(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const componentId = modal.getAttribute('data-component-id');
  const component = appState.components.find(c => c.id === componentId);
  if (!component) return;

  const nameInput = document.getElementById('config-name');
  const colorInput = document.getElementById('config-color');
  const brightnessInput = document.getElementById('config-brightness');
  const intervalInput = document.getElementById('config-interval');
  const valueInput = document.getElementById('config-value');
  const wireColorInput = document.getElementById('config-wire-color');

  if (nameInput) component.name = nameInput.value.trim();

  switch (component.type) {
    case 'light':
      if (colorInput) component.properties.color = colorInput.value;
      if (brightnessInput) component.properties.brightness = parseInt(brightnessInput.value);
      break;

    case 'timer':
      if (intervalInput) {
        const newInterval = parseInt(intervalInput.value);
        if (newInterval > 0) {
          component.properties.interval = newInterval;
          if (!component.is_on) {
            component.properties.time_left = newInterval;
          }
        }
      }
      break;

    case 'sensor':
      if (valueInput) {
        const newValue = parseFloat(valueInput.value);
        if (!isNaN(newValue)) {
          component.value = newValue;
          component.properties.default_value = newValue;
        }
      }
      break;

    case 'wire':
    case 'junction':
      if (wireColorInput) component.properties.color = wireColorInput.value;
      break;
  }

  renderComponent(component);

  closeModal(modalId);

  logStatus(`组件 ${component.name} 配置已更新`);
}

function pushButtonDown(id) {
  const component = appState.components.find(c => c.id === id);
  if (!component || component.type !== 'button') return;

  component.is_pressed = true;
  component.is_on = true;

  updateEntireCircuit();

  logStatus(`按钮 ${component.name} 已按下`);
}

function pushButtonUp(id) {
  const component = appState.components.find(c => c.id === id);
  if (!component || component.type !== 'button') return;

  component.is_pressed = false;
  component.is_on = false;

  updateEntireCircuit();

  logStatus(`按钮 ${component.name} 已释放`);
}

function updateConnectedComponents(sourceId, isOn) {
  const connections = appState.connections.filter(conn => conn.source === sourceId);

  const sourceComponent = appState.components.find(c => c.id === sourceId);
  if (!sourceComponent) return;

  if (sourceComponent.type === 'wire' || sourceComponent.type === 'junction') {
    sourceComponent.is_on = isOn;

    const element = document.getElementById(sourceId);
    if (element) {
      if (sourceComponent.type === 'wire') {
        const wireBody = element.querySelector('.wire-body');
        if (wireBody) {
          wireBody.style.opacity = isOn ? '1' : '0.6';
          wireBody.style.boxShadow = isOn ? '0 0 5px ' + sourceComponent.properties.color : 'none';
        }
      } else {
        const junctionBody = element.querySelector('.junction-body');
        if (junctionBody) {
          junctionBody.style.opacity = isOn ? '1' : '0.6';
          junctionBody.style.boxShadow = isOn ? '0 0 8px ' + sourceComponent.properties.color : 'none';
        }
      }
    }
  }

  connections.forEach(conn => {
    const targetComponent = appState.components.find(c => c.id === conn.target);
    if (!targetComponent) return;

    switch (targetComponent.type) {
      case 'light':
        const allInputConnections = appState.connections
          .filter(c => c.target === targetComponent.id)
          .map(c => ({
            sourceComp: appState.components.find(comp => comp.id === c.source),
            connection: c
          }))
          .filter(item => item.sourceComp);

        const allInputsOn = allInputConnections.every(item => item.sourceComp.is_on);

        if (targetComponent.is_on !== allInputsOn) {
          toggleLight(targetComponent.id, allInputsOn);
        }
        break;
    }
  });
}

// 更新画布上的所有组件状态
function updateEntireCircuit() {
  appState.components.forEach(comp => {
    if (comp.type === 'wire' || comp.type === 'junction') {
      comp.is_on = false;

      const element = document.getElementById(comp.id);
      if (element) {
        if (comp.type === 'wire') {
          const wireBody = element.querySelector('.wire-body');
          if (wireBody) {
            wireBody.style.opacity = '0.6';
            wireBody.style.boxShadow = 'none';
          }
        } else {
          const junctionBody = element.querySelector('.junction-body');
          if (junctionBody) {
            junctionBody.style.opacity = '0.6';
            junctionBody.style.boxShadow = 'none';
          }
        }
      }
    }
  });

  const powerSources = appState.components.filter(comp =>
    (comp.type === 'switch' || comp.type === 'button' || comp.type === 'sensor') && comp.is_on
  );

  powerSources.forEach(source => {
    updateConnectedComponents(source.id, true);
  });

  const activeTimers = appState.components.filter(comp => comp.type === 'timer' && comp.is_on);
  activeTimers.forEach(timer => {
    updateConnectedComponents(timer.id, true);
  });

  const lights = appState.components.filter(comp => comp.type === 'light');
  lights.forEach(light => {
    const allInputConnections = appState.connections
      .filter(c => c.target === light.id)
      .map(c => ({
        sourceComp: appState.components.find(comp => comp.id === c.source),
        connection: c
      }))
      .filter(item => item.sourceComp);

    if (allInputConnections.length === 0) {
      return;
    }

    const allInputsOn = allInputConnections.every(item => item.sourceComp.is_on);

    if (light.is_on !== allInputsOn) {
      toggleLight(light.id, allInputsOn);
    }
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}
