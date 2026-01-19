package com.projet.route.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.projet.route.model.Lieux;
import com.projet.route.model.RoutSignale;

@Repository
public interface RoutSignaleRepository extends JpaRepository<RoutSignale, Long> {

    List<RoutSignale> findByIdUser(String idUser);

    List<RoutSignale> findByLieux(Lieux lieux);

    List<RoutSignale> findByEtat(String etat);
}


