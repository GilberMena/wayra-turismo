@extends('layouts.app')

@section('title', 'Planes Nuquí — WAYRA')

@section('content')
<section class="section">
    <div class="container">
        <h1>Planes Temporada de Ballenas</h1>
        <p>Disfruta de nuestros paquetes todo incluido.</p>
        
        <!-- Plan details here -->
        <div class="grid">
            <article class="card">
                <h3>Nuquí Esencial</h3>
                <p>3 días / 2 noches</p>
                <button class="btn-primary">Reservar</button>
            </article>
            <article class="card">
                <h3>Experiencia Total</h3>
                <p>5 días / 4 noches</p>
                <button class="btn-primary">Reservar</button>
            </article>
        </div>
    </div>
</section>
@endsection
