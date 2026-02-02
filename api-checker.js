// Este script roda no servidor para verificar a saúde da API.
// Use: node api-checker.js

import axios from 'axios';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 3001}`;
const endpoints = [
    '/api/auth/me', // Deve retornar 401
    '/api/settings/system', // Deve retornar 401
];

async function checkDatabase() {
    console.log("-----------------------------------------");
    console.log("Verificando Conexão com o Banco de Dados...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });
        await connection.ping();
        console.log("✅ Conexão com MySQL estabelecida com sucesso.");
        await connection.end();
        return true;
    } catch (error) {
        console.error("❌ Falha ao conectar ao MySQL:", error.message);
        return false;
    }
}

async function checkApiEndpoints() {
    console.log("-----------------------------------------");
    console.log(`Verificando Endpoints da API em ${API_URL}...`);
    let allOk = true;

    for (const endpoint of endpoints) {
        try {
            await axios.get(`${API_URL}${endpoint}`);
            // Se chegar aqui, é um erro, pois deveria ser protegido
            console.error(`❌ ERRO: Endpoint ${endpoint} está desprotegido!`);
            allOk = false;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log(`✅ Endpoint ${endpoint} protegido corretamente (401 Unauthorized).`);
            } else if (error.code === 'ECONNREFUSED') {
                console.error(`❌ FALHA CRÍTICA: Não foi possível conectar à API em ${API_URL}. O servidor está rodando?`);
                return false;
            } else {
                console.error(`❌ ERRO INESPERADO no endpoint ${endpoint}:`, error.message);
                allOk = false;
            }
        }
    }
    
    if (allOk) {
        console.log("✅ Todos os endpoints de teste responderam como esperado.");
    }
    return allOk;
}

async function runHealthChecks() {
    const dbOk = await checkDatabase();
    if (!dbOk) {
        process.exit(1);
    }

    const apiOk = await checkApiEndpoints();
    if (!apiOk) {
        process.exit(1);
    }
    
    console.log("-----------------------------------------");
    console.log("🚀 Verificação de saúde completa. O sistema parece estar operacional.");
    process.exit(0);
}

runHealthChecks();
