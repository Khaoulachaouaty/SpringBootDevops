package com.itbs.clinique.services;

import com.itbs.clinique.dto.*;
import com.itbs.clinique.entities.*;
import com.itbs.clinique.repositories.*;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(UserRepository userRepository, RoleRepository roleRepository,
                          PatientRepository patientRepository, MedecinRepository medecinRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.patientRepository = patientRepository;
        this.medecinRepository = medecinRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public AuthResponse registerPatient(RegisterPatientRequest request) {
        if (userRepository.existsByUsername(request.getEmail())) {
            return AuthResponse.builder()
                    .message("Cet email est déjà utilisé")
                    .success(false)
                    .build();
        }
        
        Role patientRole = roleRepository.findByRole("PATIENT")
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setRole("PATIENT");
                    return roleRepository.save(newRole);
                });
        
        User user = new User();
        user.setUsername(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setTel(request.getTel());
        user.setEnabled(true);
        user.setRoles(Collections.singletonList(patientRole));
        
        User savedUser = userRepository.save(user);
        
        Patient patient = new Patient();
        patient.setUser(savedUser);
        patient.setDateNaissance(request.getDateNaissance());
        patient.setDossierMedical(request.getDossierMedical());
        patientRepository.save(patient);
        
        return AuthResponse.builder()
                .message("Patient inscrit avec succès")
                .success(true)
                .userId(savedUser.getUserId())
                .email(savedUser.getUsername())
                .nomComplet(savedUser.getNomComplet())
                .roles(Collections.singletonList("PATIENT"))
                .build();
    }

    @Override
    public AuthResponse createMedecin(CreateMedecinRequest request) {
        if (userRepository.existsByUsername(request.getEmail())) {
            return AuthResponse.builder()
                    .message("Cet email est déjà utilisé")
                    .success(false)
                    .build();
        }
        
        Role medecinRole = roleRepository.findByRole("MEDECIN")
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setRole("MEDECIN");
                    return roleRepository.save(newRole);
                });
        
        User user = new User();
        user.setUsername(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setTel(request.getTel());
        user.setEnabled(true);
        user.setRoles(Collections.singletonList(medecinRole));
        
        User savedUser = userRepository.save(user);
        
        Medecin medecin = new Medecin();
        medecin.setUser(savedUser);
        medecin.setSpecialite(request.getSpecialite());
        medecinRepository.save(medecin);
        
        return AuthResponse.builder()
                .message("Médecin créé avec succès")
                .success(true)
                .userId(savedUser.getUserId())
                .email(savedUser.getUsername())
                .nomComplet(savedUser.getNomComplet())
                .roles(Collections.singletonList("MEDECIN"))
                .build();
    }

@Override
public AuthResponse login(LoginRequest request) {
    User user = userRepository.findByUsername(request.getEmail())
            .orElse(null);
    
    if (user == null) {
        return AuthResponse.builder()
                .message("Email ou mot de passe incorrect")
                .success(false)
                .build();
    }
    
    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        return AuthResponse.builder()
                .message("Email ou mot de passe incorrect")
                .success(false)
                .build();
    }
    
    if (user.getEnabled() == null || !user.getEnabled()) {
        return AuthResponse.builder()
                .message("Compte désactivé")
                .success(false)
                .build();
    }
    
    // 🔥 UTILISER VOS MÉTHODES EXISTANTES
    Long patientId = patientRepository.findByUserUserId(user.getUserId())
            .map(Patient::getId)
            .orElse(null);
    
    Long medecinId = medecinRepository.findByUserUserId(user.getUserId())
            .map(Medecin::getId)
            .orElse(null);
    
    List<String> roleNames = user.getRoles().stream()
            .map(Role::getRole)
            .collect(Collectors.toList());
    
    System.out.println("✅ Login: " + user.getUsername() + 
                     " | Rôles: " + roleNames + 
                     " | PatientId: " + patientId + 
                     " | MedecinId: " + medecinId);
    
    return AuthResponse.builder()
            .message("Connexion réussie")
            .success(true)
            .userId(user.getUserId())
            .email(user.getUsername())
            .nomComplet(user.getNomComplet())
            .roles(roleNames)
            .patientId(patientId)      // 🔥 AJOUTÉ
            .medecinId(medecinId)        // 🔥 AJOUTÉ
            .build();
}

}