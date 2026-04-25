package com.itbs.clinique.entities;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
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
@ToString(exclude = {"user", "rendezVous"}) // 🔥 AJOUTÉ
@EqualsAndHashCode(exclude = {"user", "rendezVous"}) 

public class Medecin {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String specialite;
    
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @OneToMany(mappedBy = "medecin")
    private List<RendezVous> rendezVous;
    
    // Méthodes pour accéder aux données du User
    public String getNom() {
        return user != null ? user.getNom() : null;
    }
    
    public String getPrenom() {
        return user != null ? user.getPrenom() : null;
    }
    
    public String getNomComplet() {
        return user != null ? user.getNomComplet() : null;
    }
    
    public String getEmail() {
        return user != null ? user.getUsername() : null;
    }
    
    public String getTel() {
        return user != null ? user.getTel() : null;
    }
}