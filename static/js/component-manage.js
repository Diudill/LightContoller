// 获取所有组件
function displayAllComponents() {
    const container = document.getElementById('switch-list-container');
    const content = document.getElementById('switch-list-content');
    content.innerHTML = '';

    if (appState.components.length === 0) {
        content.innerHTML = '<p>当前没有组件</p>';
    } else {
        // 为每个组件创建一个列表项
        for (let i = 0; i < appState.components.length; i++) {
            const data = appState.components[i];

            const componentInCanvas = document.querySelector('#' + data.id);
            const name = componentInCanvas.querySelector('.component-label').textContent;

            const listItem = document.createElement('div');
            listItem.className = 'switch-list-item';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'switch-list-name';
            nameSpan.innerHTML = `<span class="label-name">${name}</span><span>${data.id}</span>`;

            const editButton = document.createElement('button');
            editButton.className = 'switch-list-edit';
            editButton.textContent = '编辑';
            editButton.addEventListener('click', function() {
                const newName = prompt('请输入新名称', name);
                if (newName && newName.trim() !== '') {
                    componentInCanvas.querySelector('.component-label').textContent = newName;
                    nameSpan.innerHTML = `<span class="label-name">${newName}</span><span>${data.id}</span>`;
                    logStatus(`开关 "${name}" 重命名为 "${newName}"`);
                }
            });

            const deleteButton = document.createElement('button');
            deleteButton.className = 'switch-list-delete';
            deleteButton.textContent = '删除';
            deleteButton.addEventListener('click', function() {
                if (confirm('确定要删除吗？')) {
                    // 删除组件
                    appState.components = appState.components.filter(c => c.id !== data.id);
                    // 删除连线
                    deleteRefLine(componentInCanvas);
                    // 删除画布上的组件
                    componentInCanvas.remove();
                    // 删除列表项
                    listItem.remove();
                    logStatus(`删除组件 "${name}"`);
                }
            });

            listItem.appendChild(nameSpan);

            // 只有灯或开关有toggle
            if(data.type === 'light' || data.type === 'switch') {
                const toggle = document.createElement('div');
                toggle.className = 'switch-list-toggle';

                // 有可能是灯或开关，获取方式不一样
                const lightOrSwitch = componentInCanvas.querySelector('.switch-toggle') || componentInCanvas.querySelector('.light-bulb');
                if (lightOrSwitch.classList.contains('on')) toggle.classList.add('on');

                toggle.addEventListener('click', function() {
                    const toggleBtnInDrawing = componentInCanvas.querySelector('.switch-toggle');
                    const lightInDrawing = componentInCanvas.querySelector('.toggle-light');
                    if(toggleBtnInDrawing) {
                        // 此时是开关
                        toggleBtnInDrawing.classList.toggle('on');
                    } else if (lightInDrawing) {
                        // 此时是灯
                        lightInDrawing.classList.toggle('on');
                    }

                    toggle.classList.toggle('on');

                    const newState = toggle.classList.contains('on');
                    logStatus(`开关 "${name}" ${newState ? '打开' : '关闭'}`);

                    // 触发连接的组件状态更新
                    updateRefComponents(componentInCanvas, newState);
                });
                listItem.appendChild(toggle);
            }

            listItem.appendChild(editButton);
            listItem.appendChild(deleteButton);

            content.appendChild(listItem);
        }
    }

    container.style.display = 'flex';
}

// 更新关联的组件状态
function updateRefComponents(component, state) {
    const isLight = component.id.startsWith("light-");

    // 查找所有从这个开关输出的连接线
    const connections = document.querySelectorAll('.connection-line');

    connections.forEach(function(connection) {
        // 检查连接的起点是否是这个开关的输出点
        if(isLight) { // 灯
            if (connection.dataset.target === component.id) {
                // 可能是开关或按钮
                const targetComponent = document.getElementById(connection.dataset.source);
                if(targetComponent.id.startsWith("switch-")) {
                    toggleSwitch(targetComponent.id); // 相当于点击画布上的switch开关

                    logStatus(`关联组件 "${targetComponent.querySelector('.component-label').textContent}" ${state ? '打开' : '关闭'}`);
                } else if(targetComponent.id.startsWith("button-")) {
                    // 暂时不能通过灯，改变按钮，因为按钮要持续按下
                }
            }
        } else { // 开关
            if (connection.dataset.source === component.id) {
                const targetComponent = document.getElementById(connection.dataset.target);

                // 如果目标是灯泡组件
                if (targetComponent.id.startsWith("light-")) {
                    toggleLight(targetComponent.id, state); // 更新画布上的灯泡切换

                    logStatus(`关联组件 "${targetComponent.querySelector('.component-label').textContent}" ${state ? '打开' : '关闭'}`);
                }
            }
        }

    });
}

// 删除这个组件关联的线
function deleteRefLine(component) {
    // 查找所有从这个开关输出的连接线
    const connections = document.querySelectorAll('.connection-line');

    connections.forEach(function(connection) {
        if (connection.dataset.source === component.id || connection.dataset.target === component.id) {
            connection.remove();
            logStatus(`删除连线`);
        }
    });
}
