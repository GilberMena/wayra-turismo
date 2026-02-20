@extends('layouts.app')

@section('content')
<section id="hero" class="hero" style="background-image:url('{{ asset('img/hero.svg') }}');">
    <div class="hero-overlay"></div>
    <div class="container hero-content">
        <h1>Descubre la magia del Pacífico</h1>
        <p class="lead">Avistamiento de ballenas, selva y mar en Nuquí, Chocó.</p>
        <a href="{{ route('experiences.index') }}" class="btn-primary">Ver Experiencias</a>
    </div>
</section>

<section id="sobre-wayra" class="section split">
    <div class="container" style="display:flex; gap:40px; align-items:center;">
        <div class="text">
            <h2>Sobre Link Wayra</h2>
            <p>Somos una agencia de turismo comunitario comprometida con la conservación y el desarrollo local.</p>
        </div>
        <div class="image">
            <img src="{{ asset('img/card2.svg') }}" alt="Naturaleza" style="max-width:100%; border-radius:12px;">
        </div>
    </div>
</section>

<!-- More sections from index.html would go here, adapted to Blade syntax -->
@endsection
