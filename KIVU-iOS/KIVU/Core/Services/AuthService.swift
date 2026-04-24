//
//  AuthService.swift
//  Gestion de l'authentification et du profil utilisateur
//

import Foundation
import SwiftUI

final class AuthService: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated: Bool = false
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    private let api = APIClient.shared
    private let defaults = UserDefaults.standard

    init() {
        loadPersistedUser()
    }

    func signIn(email: String, password: String) async {
        await MainActor.run { isLoading = true; errorMessage = nil }
        do {
            let user = try await api.post("/auth/signin", body: [
                "email": email,
                "password": password
            ], decodingTo: User.self)
            await MainActor.run {
                self.currentUser = user
                self.isAuthenticated = true
                self.persist(user: user)
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func signUp(name: String, email: String, password: String, preferredLanguage: String) async {
        await MainActor.run { isLoading = true; errorMessage = nil }
        do {
            let user = try await api.post("/auth/signup", body: [
                "name": name,
                "email": email,
                "password": password,
                "preferredLanguage": preferredLanguage
            ], decodingTo: User.self)
            await MainActor.run {
                self.currentUser = user
                self.isAuthenticated = true
                self.persist(user: user)
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }

    func signOut() {
        currentUser = nil
        isAuthenticated = false
        defaults.removeObject(forKey: "currentUser")
    }

    private func persist(user: User) {
        if let data = try? JSONEncoder().encode(user) {
            defaults.set(data, forKey: "currentUser")
        }
    }

    private func loadPersistedUser() {
        guard let data = defaults.data(forKey: "currentUser"),
              let user = try? JSONDecoder().decode(User.self, from: data)
        else { return }
        self.currentUser = user
        self.isAuthenticated = true
    }
}
