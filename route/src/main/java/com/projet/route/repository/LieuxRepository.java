package com.projet.route.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.projet.route.models.Lieux;

public interface LieuxRepository extends JpaRepository<Lieux, Long> {
}