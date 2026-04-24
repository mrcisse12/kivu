//
//  APIClient.swift
//  Client HTTP unifié — gère auth tokens, cache, erreurs
//

import Foundation

final class APIClient {
    static let shared = APIClient()
    private let baseURL = URL(string: "https://api.kivu.africa/v1")!
    private let session: URLSession
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    var authToken: String? {
        get { UserDefaults.standard.string(forKey: "kivu.auth.token") }
        set { UserDefaults.standard.set(newValue, forKey: "kivu.auth.token") }
    }

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.waitsForConnectivity = true
        session = URLSession(configuration: config)
        decoder.dateDecodingStrategy = .iso8601
        encoder.dateEncodingStrategy = .iso8601
    }

    // MARK: - Public
    func get<T: Decodable>(_ path: String, decodingTo: T.Type) async throws -> T {
        let request = try buildRequest(path: path, method: "GET", body: nil)
        return try await perform(request: request)
    }

    func post<T: Decodable>(_ path: String, body: [String: Any], decodingTo: T.Type) async throws -> T {
        let data = try JSONSerialization.data(withJSONObject: body)
        let request = try buildRequest(path: path, method: "POST", body: data)
        return try await perform(request: request)
    }

    func put<T: Decodable>(_ path: String, body: [String: Any], decodingTo: T.Type) async throws -> T {
        let data = try JSONSerialization.data(withJSONObject: body)
        let request = try buildRequest(path: path, method: "PUT", body: data)
        return try await perform(request: request)
    }

    func delete<T: Decodable>(_ path: String, decodingTo: T.Type) async throws -> T {
        let request = try buildRequest(path: path, method: "DELETE", body: nil)
        return try await perform(request: request)
    }

    // MARK: - Private helpers
    private func buildRequest(path: String, method: String, body: Data?) throws -> URLRequest {
        let url = baseURL.appendingPathComponent(path)
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.addValue("application/json", forHTTPHeaderField: "Content-Type")
        req.addValue("application/json", forHTTPHeaderField: "Accept")
        if let token = authToken {
            req.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        req.httpBody = body
        return req
    }

    private func perform<T: Decodable>(request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            throw APIError.server(statusCode: http.statusCode)
        }
        return try decoder.decode(T.self, from: data)
    }
}

enum APIError: LocalizedError {
    case invalidResponse
    case server(statusCode: Int)
    case decoding(Error)
    case offline

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "Réponse serveur invalide"
        case .server(let code): return "Erreur serveur (\(code))"
        case .decoding(let err): return "Erreur de décodage: \(err.localizedDescription)"
        case .offline: return "Pas de connexion — mode hors-ligne actif"
        }
    }
}
