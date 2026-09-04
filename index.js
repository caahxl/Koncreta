import express from "express"
import path from "path"
import mysql from "mysql2/promise"
import session from "express-session"

const app = express()

// permite ler dados do formulario
app.use(express.urlencoded({ extended: true }))

// Configurar Sessão (cookies)
app.use(
    session({
        secret: "segredo",          // Nomeia os cookies
        resave: false,              // Só salva os cookies novamente quando houver alterações
        saveUninitialized: true     // Cria sessão mesmo sem dados
    })
)

// Middleware - Verificar se o usuário está logado
const vericarUsuario = (req, res, next) => {

    // Se o usuário esta logado ele vai para a proxima página
    if(req.session.nome) {
        next()
    } else {
        res.redirect("/")
    }
}

//// CONEXÃO COM O BANCO DE DADOS
// Função para gerar uma conexão com o banco de dados
const gerarConexao = async () => {
    try {
        const conexao = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "12345",
            database: "saep_db"
        })

        console.log("✅ Conectado ao BD")
        return conexao

    } catch (erro) {
        console.log("❌ Erro ao conectar ao BD: " + erro)
    }
}

// Teste de BD - Aparecendo a mensagem no cmd quer dizer que conectou
//gerarConexao()

// Definir a pasta de arquivos estáticos (HTML, CSS e Imagens)
app.use(express.static("publica"))

// Definir a página inicial
app.get("/", (req, res) => {
    res.sendFile(path.resolve("publica/index.html"))
})

// Definir uma rota para a página principal
app.get("/main", vericarUsuario, (req, res) => {
    res.sendFile(path.resolve("privado/main.html"))
})

app.get("/produtos", vericarUsuario, (req, res) => {
    res.sendFile(path.resolve("privado/produtos.html"))
})

// Definir uma rota para a página estoque
app.get("/estoque", vericarUsuario,(req, res) => {
    res.sendFile(path.resolve("privado/estoque.html"))
})

//Definir uma rota para validar usuário
app.post("/login", async (req, res) => {

    try {
        const { user, senha } = req.body
        const conexao = await gerarConexao()

        const [resultadoBD] = await conexao.query(`
            SELECT * FROM tbl_koncreta_usuarios
            WHERE usuario = ? AND senha = ?
            `, [user, senha])

        // Verificar se o usuário foi localizado
        if (resultadoBD.length > 0) {

            const usuario = resultadoBD[0]
            req.session.nome = usuario.nome
            res.redirect("/main")
        }
        else {
            res.redirect("/?msg=erro")
        }

    } catch (erro) {
        console.log("❌ Erro ao consultar o usuário: " + erro)
    }
})

// Definir uma rota para consultar usuário logado
app.get("/consultar-usuario", (req, res) => {

    // Recupera o nome do usuário armazenando no cookies
    const nome = {
        nome: req.session.nome
    }

    res.json(nome)
})

// Definir uma rota para consultar todos os produtos (Ordem Alfabética Aplicada)
app.get("/consultar-produtos", async (req, res) => {

    try {
        // Recupera o valor informado no campo de busca
        const buscar = req.query.buscar || ""
        const conexao = await gerarConexao()
        
        // Corrigido: ORDER BY nome ASC para listar em ordem alfabética
        const [resultadoBD] = await conexao.query(
            `SELECT * FROM tbl_koncreta WHERE nome LIKE ? ORDER BY nome ASC`, 
            [`%${buscar}%`]
        )

        console.log("✅ Produtos consultados em ordem alfabética")

        res.json(resultadoBD)

    } catch (erro) {
        console.log("❌ Erro ao consultar produtos: " + erro)
    }
})

// Definir uma rota para cadastrar produto
app.post("/cadastrar-produto", async (req, res) => {

    const { nome, categoria, preco, unidade_medida, aplicacao } = req.body
    try {

        const conexao = await gerarConexao()
        await conexao.query(` 
            INSERT INTO 
                tbl_koncreta (nome, categoria, preco, unidade_medida, aplicacao) 
            VALUES
                (?, ?, ?, ?, ?)`,
            [nome, categoria, preco, unidade_medida || 'unidade', aplicacao || 'Geral'])

        res.redirect("/produtos")
    }

    catch (erro) {
        console.log("❌ Erro ao cadastrar produto " + erro)
    }
})

// Definir uma rota para excluir produto
app.post("/excluir-produto", async (req, res) => {

    const { id } = req.body

    try {
        const conexao = await gerarConexao()
        await conexao.query("DELETE FROM tbl_koncreta WHERE id = ?", [id])

        res.redirect("/produtos")

    } catch (erro) {
        console.log("❌ Erro ao excluir produto " + erro)
    }
})

// Definir uma rota para editar produto
app.post("/editar-produto", async (req, res) => {

    const { id, nome, categoria, preco, unidade_medida } = req.body

    try {

        const conexao = await gerarConexao()

        await conexao.query(`
            UPDATE 
                tbl_koncreta 
            SET nome = ?,
                categoria = ? ,
                preco = ?,
                unidade_medida = ?
            WHERE id = ? 
            `, [nome, categoria, preco, unidade_medida, id])

        res.redirect("/produtos")

    } catch (erro) {
        console.log("❌ Erro ao editar: " + erro)
    }
})

// Definir para consultar o estoque
app.get("/consultar-estoque", async (req, res) => {

    try {
        const conexao = await gerarConexao()
        const [resultadoBD] = await conexao.query(`
            SELECT
            produto.nome,
            produto.categoria,
            produto.id,
            SUM(IFNULL(estoque.quantidade, 0)) AS quantidade
            
            FROM tbl_koncreta_estoque AS estoque
            RIGHT JOIN tbl_koncreta AS produto ON produto.id = estoque.produto_id

            GROUP BY
                produto.nome,
                produto.categoria,
                produto.id
                
            ORDER BY
                produto.nome
            `)

        console.log("✅ Estoque consultado")

        res.json(resultadoBD)

    } catch (erro) {
        console.log("❌ Erro ao consultar o estoque " + erro)
    }
})

// Rota de movimentação de estoque (Erro Corrigido)
app.post("/cadastrar-movimentacao", async (req, res) => {

    let { id, data, quantidade, status } = req.body

    // Verificar se vai entrar (+) ou sair (-) produto do estoque
    quantidade = status == "entrada" ? quantidade : -quantidade

    // Se o formulário não enviar uma data específica, usa o momento atual
    const dataMovimentacao = data ? data : new Date()

    try {
        const conexao = await gerarConexao()
        
        // Corrigido: Alterado de 'quantity' para 'quantidade' para bater com o BD brasileiro
        await conexao.query(`
                INSERT INTO
                    tbl_koncreta_estoque(produto_id, quantidade, data_movimentacao)
                VALUES
                    (?, ?, ?)    
                `, [id, quantidade, dataMovimentacao])

        res.redirect("/estoque")

    } catch (erro) {
        console.log("❌ Erro ao cadastrar movimentação: " + erro)
    }
})

app.get("/logout", (req, res) => {

    // destruir cookie do usuario
    req.session.destroy((erro) => {

        // Verifica se houve erro
        if (erro) {
            res.send("Erro ao sair")
        }

        // Redireciona o usuario para pagina de login
        res.redirect("/")
    })
})

// Rota de fallback caso o logout ou outra rota não mapeada precise de redirecionamento global
app.use((req, res) => {
    res.redirect('/')
})

// Porta 3000
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000/")
})