<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ExperienceController;

/* |-------------------------------------------------------------------------- | Web Routes |-------------------------------------------------------------------------- */

Route::get('/', [HomeController::class , 'index'])->name('home');
Route::get('/experiencias', [ExperienceController::class , 'index'])->name('experiences.index');
Route::get('/planes-nuqui', function () {
    return view('plans-nuqui'); // Static view for plans
})->name('plans');

// Admin Routes (Protected by auth middleware in a real app)
Route::prefix('admin')->group(function () {
    Route::resource('experiencias', ExperienceController::class)->except(['show']);
});
