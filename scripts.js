// Limpar o localStorage ao carregar a página para evitar conflitos
// Inicialização das variáveis
let materials = [];
let selectedMateriais = JSON.parse(sessionStorage.getItem('selectedMateriais')) || {};
localStorage.removeItem('selectedMateriais'); // Agora está após a inicialização
let pedidoCounter = 1;

/*
function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabName).style.display = 'block';
}
*/

function openTab(tabName) {
    // Esconder todo o conteúdo das abas
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    
    // Exibir a aba selecionada
    document.getElementById(tabName).style.display = 'block';
    
    // Verificar se a aba 'materiaisTab' foi selecionada
    if (tabName === 'materiaisTab') {
        // Verificar se o campo 'contract' e 'grupo' têm valor
        const contract = document.getElementById('contract').value;
        const grupo = document.getElementById('grupo').value;
        
        if (contract && contract.trim() !== '' && grupo && grupo.trim() !== '') {
            // Chamar a função loadMateriais() se ambos os campos tiverem conteúdo
            loadMateriais();
        } else {
            console.log('Por favor, selecione um contrato e um grupo antes de carregar os materiais.');
        }
    }
}


async function getFileNameJson(contract, grupo) {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        
        if (config[contract] && config[contract][grupo]) {
            return config[contract][grupo];
        } else {
            throw new Error('Combinação de contrato e grupo não encontrada.');
        }
    } catch (error) {
        console.error('Erro ao obter o nome do arquivo:', error);
        return null;
    }
}

async function loadMateriais() {
    const contract = document.getElementById('contract').value;
    const grupo = document.getElementById('grupo').value.toLowerCase();

    try {
        const fileName = await getFileNameJson(contract, grupo);
        
        if (fileName) {
            const response = await fetch(fileName);
            if (!response.ok) {
                throw new Error('Erro ao carregar o arquivo JSON.');
            }
            const data = await response.json();
            materials = data; // Supondo que 'materials' é uma variável global
            filterMateriais(); // Certifique-se de que essa função está definida e faz o que é necessário
        } else {
            console.error('Nome do arquivo não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao carregar materiais:', error);
    }
}
/*
function loadMateriais() {
    const contract = document.getElementById('contract').value;
    const grupo = document.getElementById('grupo').value.toLowerCase();
    let fileName = '';
    
    if (grupo === 'epi') {
        if (contract === 'corte') {
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
    
    getFileName(contract, grupo).then(fileName => {
    if (fileName) {
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
}
*/

function displayMateriais(filteredMateriais) {
    const materialList = document.getElementById('materialList');
    materialList.innerHTML = '';
    filteredMateriais.forEach(material => {
        let div = document.createElement('div');
        
        //let descricaoTruncada = material.descricao.substring(0, 54);

        let descricaoTruncada = material.descricao && material.descricao.trim() !== "" 
            ? material.descricao.substring(0, 54) 
            : "";
        
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

        //localStorage.setItem('selectedMateriais', JSON.stringify(selectedMateriais));
        sessionStorage.setItem('selectedMateriais', JSON.stringify(selectedMateriais));
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

// Função para filtrar os materiais com base no campo de pesquisa
function filterMateriais() {
    // Pegar o valor do campo 'search'
    const searchValue = document.getElementById('search').value;

    // Verificar se o searchValue é vazio ou nulo
    if (!searchValue || searchValue.trim() === "") {
        // Se for vazio ou nulo, exibir todos os materiais
        displayMateriais(materials);
        return; // Não continuar com a filtragem
    }

    // Se searchValue tiver valor, filtrar materiais (ignorando maiúsculas e minúsculas)
    const filteredMateriais = materials.filter(material => 
        material.descricao.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Exibir os materiais filtrados
    displayMateriais(filteredMateriais);
}

/*
function filterMateriais() {
    const searchValue = document.getElementById('search').value.toUpperCase();
    const filteredMateriais = materials.filter(material => 
        material.descricao.toUpperCase().includes(searchValue)
    );
    displayMateriais(filteredMateriais);
}
*/

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
/*
function updateTotalQuantity() {
    const totalQuantity = Object.values(selectedMateriais).reduce((total, item) => {
        // Converte a quantidade para número antes de somar
        const quantity = parseInt(item.quantity, 10);
        return total + (isNaN(quantity) ? 0 : quantity);
    }, 0);

    document.getElementById('totalAdded').textContent = totalQuantity;
}
*/

function updateTotalQuantity() {
    const totalQuantity = Object.values(selectedMateriais).reduce((total, item) => {
        const quantity = parseInt(item.quantity, 10);
        return total + (isNaN(quantity) ? 0 : quantity);
    }, 0);

    document.getElementById('totalAdded').textContent = totalQuantity;

    // Retorna o total da quantidade
    return totalQuantity;
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

    // Chama a função e armazena o valor retornado
    const total = updateTotalQuantity();

    // Testa se o valor é maior que 0
    if (total <= 0) {
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

    // Obtém o botão pelo ID
    const limparSelecaoButton = document.getElementById('limparSelecao');
    // Verifica se o botão foi encontrado
    if (limparSelecaoButton) {
        // Simula o clique no botão
        limparSelecaoButton.click();
    }

    localStorage.removeItem('selectedMateriais');
    sessionStorage.removeItem('selectedMateriais');  
    sessionStorage.setItem('selectedMateriais', JSON.stringify(selectedMateriais));
    selectedMateriais = {}; // Limpa o objeto local
    updateTotalQuantity();
    zerarContador(); // Limpa selectedMateriais para duplicar    
    filterMateriais(); // Atualiza a exibição de materiais
    
    const encodedMessage = encodeURIComponent(pedidoMensagem);
    const whatsappNumber = '5591992069559';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    /*
    const pedidoBlob = new Blob([JSON.stringify(pedidoData, null, 2)], { type: 'application/json' });
    const pedidoUrl = URL.createObjectURL(pedidoBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = pedidoUrl;
    downloadLink.download = fileName;
    downloadLink.click();
    */

    window.open(whatsappUrl, '_blank');

    //Redirecionar para o menu principal (index.html)
    window.location.href = 'agradecimento.html';
    window.close()
}

function zerarContador() {
    // Verificar se 'selectedMateriais' está no localStorage
    if (localStorage.getItem('selectedMateriais')) {
        localStorage.removeItem('selectedMateriais');
    }
    
    // Verificar se 'selectedMateriais' está no sessionStorage
    if (sessionStorage.getItem('selectedMateriais')) {
        sessionStorage.removeItem('selectedMateriais');
    }    
    sessionStorage.setItem('selectedMateriais', JSON.stringify(selectedMateriais));
    selectedMateriais = {}; // Também limpa o objeto local
    updateTotalQuantity();
}

function validateNumber(input) {
    const value = input.value;

    // Verifica se o valor contém apenas dígitos
    if (!/^\d*$/.test(value)) {
        input.value = value.replace(/\D/g, ''); // Remove todos os caracteres que não são números
    }
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