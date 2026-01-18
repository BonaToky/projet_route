package com.projet.route.repository;

import com.projet.route.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Role findByNom(String nom);
}