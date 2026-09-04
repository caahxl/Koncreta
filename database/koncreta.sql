CREATE DATABASE IF NOT EXISTS saep_db;
USE saep_db;

CREATE TABLE IF NOT EXISTS tbl_koncreta_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(200) NOT NULL UNIQUE,
    senha VARCHAR(200) NOT NULL,
    nome VARCHAR(200) NOT NULL
);

INSERT INTO tbl_koncreta_usuarios (id, usuario, senha, nome) VALUES
(1, 'marcos_gerente', 'konk_master01', 'Marcos Silva'),
(2, 'aline_estoque', 'areia_brita22', 'Aline Souza'),
(3, 'bruno_logistica', 'telha_fibro99', 'Bruno Ferreira'),
(4, 'fernanda_compras', 'cimento_plus77', 'Fernanda Lima');

SELECT * FROM tbl_koncreta_usuarios;

CREATE TABLE IF NOT EXISTS tbl_koncreta(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    categoria VARCHAR(200) NOT NULL,              
    preco DECIMAL(10,2) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,          
    peso DECIMAL(10,2) NULL,                      
    aplicacao VARCHAR(100) NOT NULL,             
    cor VARCHAR(50) DEFAULT NULL,                 
    textura VARCHAR(100) DEFAULT NULL,            
    material_fabricacao VARCHAR(100) DEFAULT NULL
);

INSERT INTO tbl_koncreta (id, nome, categoria, preco, unidade_medida, peso, aplicacao, cor, textura, material_fabricacao) VALUES
(1, 'Cimento CP II Votoran 50kg', 'Cimento', 32.90, 'kg', 50.00, 'Estrutura', NULL, NULL, NULL),
(2, 'Tinta Acrílica Fosca Premium Branca 18L', 'Tinta', 289.90, 'litros', 24.00, 'Acabamento', 'Branco', 'Fosco', NULL),
(3, 'Tinta Acrílica Toque de Seda Amarelo 3.6L', 'Tinta', 124.50, 'litros', 4.50, 'Acabamento', 'Amarelo', 'Acetinado', NULL),
(4, 'Milheiro de Tijolo Baiano 8 Furos', 'Tijolo', 890.00, 'unidade', 2500.00, 'Estrutura', NULL, NULL, 'Argila'),
(5, 'Janela de Alumínio Veneziana 100x120cm', 'Esquadria', 416.00, 'unidade', 12.00, 'Acabamento', 'Branco', NULL, 'Alumínio'),
(6, 'Porta de Madeira Maciça Angelim', 'Esquadria', 642.00, 'unidade', 28.00, 'Acabamento', 'Natural', 'Madeira', 'Madeira'),
(7, 'Areia Fina Lavada Ensacada', 'Areia', 15.00, 'kg', 20.00, 'Fundação', NULL, NULL, NULL),
(8, 'Brita nº 1 Ensacada', 'Brita', 19.90, 'kg', 20.00, 'Estrutura', NULL, NULL, NULL),
(9, 'Telha Cerâmica Romana', 'Telha', 2.20, 'unidade', 3.00, 'Acabamento', 'Cerâmica', NULL, 'Argila'),
(10, 'Argamassa ACIII 20kg', 'Cimento', 31.00, 'kg', 20.00, 'Acabamento', NULL, NULL, NULL);

SELECT * FROM tbl_koncreta;

CREATE TABLE IF NOT EXISTS tbl_koncreta_estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quantidade INT NOT NULL,
    data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    produto_id INT NOT NULL,
    
    CONSTRAINT fk_koncreta_produto
    FOREIGN KEY (produto_id)
    REFERENCES tbl_koncreta(id)
    ON DELETE CASCADE
);

INSERT INTO tbl_koncreta_estoque(id, quantidade, produto_id) VALUES
(1, 50, 1),   -- Entrada de 50 sacos de Cimento (ID 1)
(2, 12, 2),   -- Entrada de 12 latas de Tinta Branca (ID 2)
(3, 30, 1),   -- Entrada de mais 30 sacos de Cimento (ID 1)
(4, -5, 1),   -- Saída/Venda de 5 sacos de Cimento (ID 1)
(5, 100, 7),  -- Entrada de 100 sacos de Areia (ID 7)
(6, -2, 2);   -- Saída/Venda de 2 latas de Tinta Branca (ID 2)

SELECT * FROM tbl_koncreta_estoque;

SELECT
    produto.id AS codigo_produto,
    produto.nome AS nome_produto,
    produto.categoria,
    produto.unidade_medida,
    SUM(IFNULL(estoque.quantidade, 0)) AS saldo_atual

FROM tbl_koncreta_estoque AS estoque
RIGHT JOIN tbl_koncreta AS produto ON produto.id = estoque.produto_id

GROUP BY
    produto.id,
    produto.nome,
    produto.categoria,
    produto.unidade_medida
    
ORDER BY
    produto.nome;
