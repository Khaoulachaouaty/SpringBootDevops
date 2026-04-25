package com.itbs.clinique.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.itbs.clinique.entities.Medecin;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedecinRepository extends JpaRepository<Medecin, Long> {
    Optional<Medecin> findByUserUsername(String username);
    List<Medecin> findBySpecialite(String specialite);
    
    Optional<Medecin> findByUserUserId(Long userId);
}