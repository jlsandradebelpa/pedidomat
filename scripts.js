let materials = [];
let selectedMateriais = JSON.parse(localStorage.getItem('selectedMateriais')) || {};
let pedidoCounter = 1;

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabName).style.display = 'block';
}

function loadMateriais() {
    const contract = document.getElementById('contract').value;
    const grupo = document.getElementById('grupo').value.toLowerCase();

    //const fileName = contract === 'linha_viva' ? 'linha_viva.json' : 'linha_morta.json';
    let fileName = '';

    if (contract === 'corte') {
        if (grupo === 'epi') {
            fileName = 'corte_epi.json';
        }else if (grupo === 'epc') {
            fileName = 'corte_epc.json';

        }
    } else if (contract === 'ligacao_nova') {
        if (grupo === 'epi') {
            fileName = 'liganova_epi.json';
        }else if (grupo === 'epc') {
           fileName = 'liganova_epc.json';
        }
    } else if (contract === 'fiscalizacao') {
        if (grupo === 'epi') {
            fileName = 'fiscal_epi.json';
        }else if (grupo === 'epc') {
           fileName = 'fiscal_epc.json';
        }        
    }

    fetch(fileName)
        .then(response => response.json())
        .then(data => {
            materials = data;
            filterMateriais();
        })
        .catch(error => {
            console.error('Erro ao carregar o arquivo JSON:', error);
        });
}

function displayMateriais(filteredMateriais) {
    const materialList = document.getElementById('materialList');
    materialList.innerHTML = '';
    filteredMateriais.forEach(material => {
        let div = document.createElement('div');
        let descricaoTruncada = material.descricao.substring(0, 54);
        div.classList.add('material-item');
        div.innerHTML = `
            <span class="material-item">${material.codigo} - ${descricaoTruncada}</span>
            <input id="qtd-${material.codigo}" type="text" placeholder="Qtd" class="qtd-input" oninput="validateNumber(this)">
            <button onclick="addMaterial('${material.codigo}', '${material.descricao}')" class="button-add"><img src="concluido.png" alt="Concluído" />
            <button onclick="removeMaterial('${material.codigo}')" class="button-remove"><img src="cancelar.png" alt="Cancelar" />
            `;
        materialList.appendChild(div);
    });
}

function addMaterial(codigo, descricao) {
    const quantityInput = document.getElementById(`qtd-${codigo}`);
    const quantity = parseInt(quantityInput.value, 10);

    if (quantity > 0) {
        if (selectedMateriais[codigo]) {
            selectedMateriais[codigo].quantity += quantity;
        } else {
            selectedMateriais[codigo] = { descricao, quantity };
        }

        localStorage.setItem('selectedMateriais', JSON.stringify(selectedMateriais));
        updateTotalQuantity();

        // Exibe uma mensagem de confirmação
        alert(`Material "${descricao}" com a quantidade ${quantity} foi confirmado na lista.`);
    } else {
        alert('Por favor, insira uma quantidade válida.');
    }
}

function removeMaterial(codigo) {
    const quantityInput = document.getElementById(`qtd-${codigo}`);
    const quantity = parseInt(quantityInput.value, 10);

    if (selectedMateriais[codigo]) {
        if (quantity > 0) {
            if (selectedMateriais[codigo].quantity > quantity) {
                selectedMateriais[codigo].quantity -= quantity;
            } else {
                delete selectedMateriais[codigo];
            }
            localStorage.setItem('selectedMateriais', JSON.stringify(selectedMateriais));
            updateTotalQuantity();

            // Exibe uma mensagem de confirmação
            alert(`Material "${descricao}" com a quantidade ${quantity} retirada da lista.`);
        } else {
            alert('Faltando a qtde.');
        }
    } else {
        alert('Material não encontrado na lista.');
    }
}

function filterMateriais() {
    const searchValue = document.getElementById('search').value.toUpperCase();
    const filteredMateriais = materials.filter(material => 
        material.descricao.toUpperCase().includes(searchValue)
    );
    displayMateriais(filteredMateriais);
}

function convertToUppercase() {
    const searchInput = document.getElementById('search');
    searchInput.value = searchInput.value.toUpperCase();
}

function handleInput() {
    convertToUppercase();
    filterMateriais();
}

/*
function updateTotalQuantity() {
    const totalQuantity = Object.values(selectedMateriais).reduce((total, item) => total + item.quantity, 0);
    document.getElementById('totalAdded').textContent = totalQuantity;
}
*/
function updateTotalQuantity() {
    const totalQuantity = Object.values(selectedMateriais).reduce((total, item) => {
        // Converte a quantidade para número antes de somar
        const quantity = parseInt(item.quantity, 10);
        return total + (isNaN(quantity) ? 0 : quantity);
    }, 0);

    document.getElementById('totalAdded').textContent = totalQuantity;
}

function finalizeRequest() {
    const matricula = document.getElementById('matricula').value;
    const grupo = document.getElementById('grupo').value;
    const contract = document.getElementById('contract').value;

    if (!matricula) {
        alert('Por favor, preencha o campo Matrícula.');
        document.getElementById('matricula').focus();
        return;
    }

    if (Object.keys(selectedMateriais).length === 0 || !matricula) {
        alert('Nenhum material foi selecionado ou matrícula não informada.');
        return;
    }

    const now = new Date();
    const timestamp = now.getFullYear().toString() +
                    (now.getMonth() + 1).toString().padStart(2, '0') +
                    now.getDate().toString().padStart(2, '0') + "_" +
                    now.getHours().toString().padStart(2, '0') +
                    now.getMinutes().toString().padStart(2, '0') +
                    now.getSeconds().toString().padStart(2, '0');
    const pedidoNumber = pedidoCounter++;
    const fileName = `ped${matricula}_${timestamp}.json`;
    const pedidoData = {
        numero_pedido: pedidoNumber,
        matricula,
        grupo,
        contrato: contract,
        materiais: selectedMateriais
    };

    let pedidoMensagem = `Solicitação de Material #${pedidoData.numero_pedido}\n`;
    pedidoMensagem += `Matrícula: ${pedidoData.matricula}\n`;
    pedidoMensagem += `Grupo: ${pedidoData.grupo}\n`;
    pedidoMensagem += `Contrato: ${pedidoData.contrato}\n`;
    pedidoMensagem += 'Materiais:\n';
    for (const codigo in pedidoData.materiais) {
        const item = pedidoData.materiais[codigo];
        pedidoMensagem += `- ${item.descricao}: ${item.quantity} unidade(s)\n`;
    }

    const encodedMessage = encodeURIComponent(pedidoMensagem);
    const whatsappNumber = '5591992069559';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    const pedidoBlob = new Blob([JSON.stringify(pedidoData, null, 2)], { type: 'application/json' });
    const pedidoUrl = URL.createObjectURL(pedidoBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = pedidoUrl;
    downloadLink.download = fileName;
    downloadLink.click();

    window.open(whatsappUrl, '_blank');
}

function validateNumber(input) {
    const value = input.value;

    // Verifica se o valor contém apenas dígitos
    if (!/^\d*$/.test(value)) {
        input.value = value.replace(/\D/g, ''); // Remove todos os caracteres que não são números
    }
}

function zerarContador() {
    selectedMateriais = {};
    localStorage.setItem('selectedMateriais', JSON.stringify(selectedMateriais));
    updateTotalQuantity();
}

// Zera as solicitações antes de abrir a pagina
//zerarContador()
// Carregar materiais ao abrir a página
//loadMaterials();


/*
function openAddInfoFrame() {
    document.getElementById('addInfoFrame').style.display = 'block';
}

function closeAddInfoFrame() {
    document.getElementById('addInfoFrame').style.display = 'none';
}

function capturePhoto() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const photoUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = photoUrl;
                downloadLink.download = 'captured_image.png';
                downloadLink.click();
            })
            .catch(error => {
                console.error('Erro ao acessar a câmera:', error);
                alert('Não foi possível acessar a câmera.');
            });
    } else {
        alert('Câmera não disponível no seu dispositivo.');
    }
}*/
