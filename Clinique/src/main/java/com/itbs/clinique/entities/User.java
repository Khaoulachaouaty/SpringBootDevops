package com.itbs.clinique.entities;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"roles", "patient", "medecin"}) // 🔥 AJOUTÉ
@EqualsAndHashCode(exclude = {"roles", "patient", "medecin"}) // 🔥 AJOUTÉ

public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  //mysql fait incrémentation
    private Long userId;
    
    @Column(unique = true)
    private String username; // email
    
    private String password;
    
    private String nom;
    
    private String prenom;
    
    private String tel;
    
    private Boolean enabled;
    
    @ManyToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinTable(name = "user_role",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id"))
    private List<Role> roles;
    
    @OneToOne(mappedBy = "user")
    private Patient patient;
    
    @OneToOne(mappedBy = "user")
    private Medecin medecin;
    
    // Méthode utilitaire pour obtenir le nom complet
    public String getNomComplet() {
        return (prenom != null ? prenom : "") + " " + (nom != null ? nom : "");
    }
}